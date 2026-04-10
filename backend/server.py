from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, File, UploadFile, Depends, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import io
import resend

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_ALGORITHM = "HS256"

# Email Config
resend.api_key = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@falintil.tl")
EMAIL_ENABLED = bool(resend.api_key)

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# Password helpers
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT helpers
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, 
        "email": email, 
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24), 
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# Local File Storage
import pathlib

UPLOAD_DIR = pathlib.Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
APP_NAME = "disciplina-fdtl"

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Save file to local filesystem"""
    file_path = UPLOAD_DIR / path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(data)
    return {"path": path}

def get_object(path: str):
    """Read file from local filesystem"""
    file_path = UPLOAD_DIR / path
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    
    # Determine content type
    ext = file_path.suffix.lower()
    content_types = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }
    ct = content_types.get(ext, "application/octet-stream")
    return file_path.read_bytes(), ct

# Create the main app
app = FastAPI(title="Sistema de Gestão Disciplinar - FALINTIL-FDTL")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    tipo: str = Field(..., pattern="^(super_admin|admin|pessoal_justica|pessoal_superior)$")

class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    tipo: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    nome: str
    email: str
    tipo: str
    foto_url: Optional[str] = None
    created_at: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CaseCreate(BaseModel):
    data_registo: str
    hora: str
    tipo_caso: str
    refere_ao: str
    posto: str
    componente_unidade: str
    requerente: str
    telefone_requerente: Optional[str] = None
    telefone: Optional[str] = None
    nim: Optional[str] = None
    sexo: Optional[str] = None

class CaseProcess(BaseModel):
    tipo_sancao: str
    data_despacho: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    oficial_instrutor: Optional[str] = None
    observacao: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(processado|arquivado|pendente|anulado|em_processo)$")
    despacho_url: Optional[str] = None

class PasswordVerify(BaseModel):
    password: str

# Auth helper
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

def require_roles(*roles):
    async def dependency(request: Request):
        user = await get_current_user(request)
        if user["tipo"] not in roles:
            raise HTTPException(status_code=403, detail="Permissão negada")
        return user
    return dependency

# Activity Log helper
async def log_activity(user_id: str, user_nome: str, acao: str, detalhes: str = ""):
    log_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_nome": user_nome,
        "acao": acao,
        "detalhes": detalhes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.activity_logs.insert_one(log_entry)

# In-app notification helper for admins
async def create_admin_notification(action: str, case_numero: str, case_refere_ao: str, actor_name: str, case_id: str):
    """Create in-app notification for super_admin and admin users"""
    notification = {
        "id": str(uuid.uuid4()),
        "type": "case_action",
        "action": action,
        "case_numero": case_numero,
        "case_refere_ao": case_refere_ao,
        "case_id": case_id,
        "actor_name": actor_name,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_notifications.insert_one(notification)

# Email notification helper
async def send_status_notification(case_numero: str, case_refere_ao: str, new_status: str, old_status: str = None):
    """Send email notification when case status changes"""
    if not EMAIL_ENABLED:
        logger.info("Email notifications disabled (no API key)")
        return
    
    status_labels = {
        'pendente': 'Pendente',
        'em_processo': 'Em Processo',
        'processado': 'Processado',
        'arquivado': 'Arquivado',
        'anulado': 'Anulado'
    }
    
    try:
        # Get all admin users to notify
        admins = await db.users.find(
            {"tipo": {"$in": ["super_admin", "admin"]}},
            {"_id": 0, "email": 1, "nome": 1}
        ).to_list(100)
        
        if not admins:
            return
        
        subject = f"[F-FDTL] Caso {case_numero} - Status alterado para {status_labels.get(new_status, new_status)}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a2e; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">FALINTIL-FDTL</h1>
                <p style="color: #ccc; margin: 5px 0;">Direção Justiça e Disciplina</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333;">Atualização de Caso Disciplinar</h2>
                <p>O status do caso foi atualizado:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Número do Caso:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">{case_numero}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Refere a:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">{case_refere_ao}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;"><strong>Novo Status:</strong></td>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #fff;">
                            <span style="background: {'#166534' if new_status == 'processado' else '#9A3412' if new_status == 'pendente' else '#1E40AF' if new_status == 'em_processo' else '#3F3F46'}; color: white; padding: 4px 8px; font-size: 12px;">
                                {status_labels.get(new_status, new_status).upper()}
                            </span>
                        </td>
                    </tr>
                </table>
                <p style="color: #666; font-size: 14px;">
                    Acesse o sistema para mais detalhes.
                </p>
            </div>
            <div style="background: #333; padding: 15px; text-align: center;">
                <p style="color: #999; margin: 0; font-size: 12px;">
                    F-FDTL: Divisão de Comunicações e Sistema de Informação @2026
                </p>
            </div>
        </div>
        """
        
        for admin in admins:
            try:
                resend.Emails.send({
                    "from": EMAIL_FROM,
                    "to": admin["email"],
                    "subject": subject,
                    "html": html_content
                })
                logger.info(f"Email sent to {admin['email']} for case {case_numero}")
            except Exception as e:
                logger.error(f"Failed to send email to {admin['email']}: {e}")
                
    except Exception as e:
        logger.error(f"Email notification error: {e}")

# Auth Routes
@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    email = request.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    access_token = create_access_token(user["id"], user["email"], user["tipo"])
    refresh_token = create_refresh_token(user["id"])
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    await log_activity(user["id"], user["nome"], "LOGIN", f"Login realizado")
    
    return {
        "id": user["id"],
        "nome": user["nome"],
        "email": user["email"],
        "tipo": user["tipo"],
        "foto_url": user.get("foto_url"),
        "token": access_token
    }

@api_router.post("/auth/logout")
async def logout(response: Response, request: Request):
    try:
        user = await get_current_user(request)
        await log_activity(user["id"], user["nome"], "LOGOUT", "Logout realizado")
    except:
        pass
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logout realizado"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/verify-password")
async def verify_user_password(data: PasswordVerify, request: Request):
    user = await get_current_user(request)
    full_user = await db.users.find_one({"id": user["id"]})
    if not verify_password(data.password, full_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    return {"verified": True}

# User Routes
@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, request: Request):
    current_user = await require_roles("super_admin", "admin")(request)
    
    # Admin não pode criar super_admin ou admin
    if current_user["tipo"] == "admin" and user_data.tipo in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Admin não pode criar este tipo de usuário")
    
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "nome": user_data.nome,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.senha),
        "tipo": user_data.tipo,
        "foto_url": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    await log_activity(current_user["id"], current_user["nome"], "CREATE_USER", f"Usuário {user_data.nome} criado")
    
    return UserResponse(
        id=user_id,
        nome=user["nome"],
        email=user["email"],
        tipo=user["tipo"],
        foto_url=user["foto_url"],
        created_at=user["created_at"]
    )

@api_router.get("/users", response_model=List[UserResponse])
async def list_users(request: Request):
    await require_roles("super_admin", "admin")(request)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, request: Request):
    await get_current_user(request)
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return UserResponse(**user)

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, request: Request):
    current_user = await require_roles("super_admin", "admin")(request)
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Admin não pode editar super_admin
    if current_user["tipo"] == "admin" and target_user["tipo"] == "super_admin":
        raise HTTPException(status_code=403, detail="Não tem permissão para editar este usuário")
    
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        await log_activity(current_user["id"], current_user["nome"], "UPDATE_USER", f"Usuário {user_id} atualizado")
    
    return {"message": "Usuário atualizado"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    current_user = await require_roles("super_admin")(request)
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if target_user["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Não pode deletar a própria conta")
    
    await db.users.delete_one({"id": user_id})
    await log_activity(current_user["id"], current_user["nome"], "DELETE_USER", f"Usuário {target_user['nome']} deletado")
    
    return {"message": "Usuário deletado"}

@api_router.put("/users/{user_id}/password")
async def update_password(user_id: str, request: Request):
    body = await request.json()
    current_user = await get_current_user(request)
    
    # Só pode alterar própria senha ou super_admin pode alterar de outros
    if current_user["id"] != user_id and current_user["tipo"] != "super_admin":
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    new_password = body.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")
    
    await db.users.update_one({"id": user_id}, {"$set": {"password_hash": hash_password(new_password)}})
    await log_activity(current_user["id"], current_user["nome"], "CHANGE_PASSWORD", f"Senha alterada para usuário {user_id}")
    
    return {"message": "Senha alterada com sucesso"}

# Case Routes
@api_router.post("/cases")
async def create_case(case_data: CaseCreate, request: Request):
    current_user = await require_roles("super_admin", "admin", "pessoal_justica")(request)
    
    # Generate case number
    count = await db.cases.count_documents({})
    case_number = f"CASO-{datetime.now().year}-{str(count + 1).zfill(5)}"
    
    case = {
        "id": str(uuid.uuid4()),
        "numero": case_number,
        "data_registo": case_data.data_registo,
        "hora": case_data.hora,
        "tipo_caso": case_data.tipo_caso,
        "refere_ao": case_data.refere_ao,
        "posto": case_data.posto,
        "componente_unidade": case_data.componente_unidade,
        "requerente": case_data.requerente,
        "telefone_requerente": case_data.telefone_requerente,
        "telefone": case_data.telefone,
        "nim": case_data.nim,
        "sexo": case_data.sexo,
        "status": "pendente",
        "registrado_por": current_user["nome"],
        "registrado_por_id": current_user["id"],
        "foto_membro_url": None,
        "anexo_pdf_url": None,
        "despacho_url": None,
        "tipo_sancao": None,
        "data_despacho": None,
        "data_inicio": None,
        "data_fim": None,
        "oficial_instrutor": None,
        "observacao": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cases.insert_one(case)
    await log_activity(current_user["id"], current_user["nome"], "CREATE_CASE", f"Caso {case_number} criado")
    
    asyncio.create_task(create_admin_notification("registrou", case_number, case_data.refere_ao, current_user["nome"], case["id"]))
    
    case.pop("_id", None)
    return case

@api_router.get("/cases")
async def list_cases(
    request: Request,
    status: Optional[str] = None,
    unidade: Optional[str] = None,
    posto: Optional[str] = None,
    tipo_sancao: Optional[str] = None,
    sexo: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    await get_current_user(request)
    
    query = {}
    if status:
        query["status"] = status
    if unidade:
        query["componente_unidade"] = {"$regex": unidade, "$options": "i"}
    if posto:
        query["posto"] = posto
    if tipo_sancao:
        query["tipo_sancao"] = tipo_sancao
    if sexo:
        query["sexo"] = sexo
    if search:
        query["$or"] = [
            {"refere_ao": {"$regex": search, "$options": "i"}},
            {"numero": {"$regex": search, "$options": "i"}},
            {"nim": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    cases = await db.cases.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.cases.count_documents(query)
    
    return {"cases": cases, "total": total, "page": page, "limit": limit}

@api_router.get("/cases/{case_id}")
async def get_case(case_id: str, request: Request):
    await get_current_user(request)
    case = await db.cases.find_one({"id": case_id}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Caso não encontrado")
    return case

@api_router.put("/cases/{case_id}")
async def update_case(case_id: str, request: Request):
    current_user = await require_roles("super_admin", "admin", "pessoal_justica")(request)
    body = await request.json()
    
    case = await db.cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Caso não encontrado")
    
    # Remove fields that shouldn't be updated
    body.pop("id", None)
    body.pop("numero", None)
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.cases.update_one({"id": case_id}, {"$set": body})
    await log_activity(current_user["id"], current_user["nome"], "UPDATE_CASE", f"Caso {case['numero']} atualizado")
    
    asyncio.create_task(create_admin_notification("editou", case["numero"], case.get("refere_ao", ""), current_user["nome"], case_id))
    
    return {"message": "Caso atualizado"}

@api_router.put("/cases/{case_id}/status")
async def update_case_status(case_id: str, status_data: StatusUpdate, request: Request):
    current_user = await require_roles("super_admin", "admin", "pessoal_justica")(request)
    
    case = await db.cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Caso não encontrado")
    
    update_data = {
        "status": status_data.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if status_data.despacho_url:
        update_data["despacho_url"] = status_data.despacho_url
    
    await db.cases.update_one({"id": case_id}, {"$set": update_data})
    await log_activity(current_user["id"], current_user["nome"], "UPDATE_STATUS", f"Caso {case['numero']} - status: {status_data.status}")
    
    status_labels = {"processado": "processou", "arquivado": "arquivou", "pendente": "reabriu", "anulado": "anulou", "em_processo": "colocou em processo"}
    asyncio.create_task(create_admin_notification(status_labels.get(status_data.status, "alterou status de"), case["numero"], case.get("refere_ao", ""), current_user["nome"], case_id))
    
    # Send notification email (async, non-blocking)
    old_status = case.get("status")
    asyncio.create_task(send_status_notification(case["numero"], case["refere_ao"], status_data.status, old_status))
    
    return {"message": "Status atualizado"}

@api_router.put("/cases/{case_id}/process")
async def process_case(case_id: str, process_data: CaseProcess, request: Request):
    current_user = await require_roles("super_admin", "admin", "pessoal_justica")(request)
    
    case = await db.cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Caso não encontrado")
    
    update_data = {
        "status": "processado",
        "tipo_sancao": process_data.tipo_sancao,
        "data_despacho": process_data.data_despacho,
        "data_inicio": process_data.data_inicio,
        "data_fim": process_data.data_fim,
        "oficial_instrutor": process_data.oficial_instrutor,
        "observacao": process_data.observacao,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cases.update_one({"id": case_id}, {"$set": update_data})
    await log_activity(current_user["id"], current_user["nome"], "PROCESS_CASE", f"Caso {case['numero']} processado - sanção: {process_data.tipo_sancao}")
    
    asyncio.create_task(create_admin_notification("processou", case["numero"], case.get("refere_ao", ""), current_user["nome"], case_id))
    
    # Send notification email
    old_status = case.get("status")
    asyncio.create_task(send_status_notification(case["numero"], case["refere_ao"], "processado", old_status))
    
    return {"message": "Caso processado"}

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str, request: Request):
    current_user = await require_roles("super_admin")(request)
    
    case = await db.cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Caso não encontrado")
    
    await db.cases.delete_one({"id": case_id})
    await log_activity(current_user["id"], current_user["nome"], "DELETE_CASE", f"Caso {case['numero']} deletado")
    
    return {"message": "Caso deletado"}

# File Upload Routes
@api_router.post("/upload/foto/{case_id}")
async def upload_foto(case_id: str, file: UploadFile = File(...), request: Request = None):
    current_user = await require_roles("super_admin", "admin", "pessoal_justica")(request)
    
    if file.size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="Arquivo muito grande (máx 5MB)")
    
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Formato inválido (aceito: JPG, PNG)")
    
    path = f"{APP_NAME}/fotos/{case_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    
    await db.cases.update_one({"id": case_id}, {"$set": {"foto_membro_url": result["path"]}})
    
    return {"url": result["path"]}

@api_router.post("/upload/pdf/{case_id}")
async def upload_pdf(case_id: str, file: UploadFile = File(...), request: Request = None):
    current_user = await require_roles("super_admin", "admin", "pessoal_justica")(request)
    
    if file.size > 20 * 1024 * 1024:  # 20MB
        raise HTTPException(status_code=400, detail="Arquivo muito grande (máx 20MB)")
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Formato inválido (aceito: PDF)")
    
    path = f"{APP_NAME}/pdfs/{case_id}/{uuid.uuid4()}.pdf"
    data = await file.read()
    result = put_object(path, data, "application/pdf")
    
    await db.cases.update_one({"id": case_id}, {"$set": {"anexo_pdf_url": result["path"]}})
    
    return {"url": result["path"]}

@api_router.post("/upload/despacho/{case_id}")
async def upload_despacho(case_id: str, file: UploadFile = File(...), request: Request = None):
    current_user = await require_roles("super_admin", "admin", "pessoal_justica")(request)
    
    if file.size > 20 * 1024 * 1024:  # 20MB
        raise HTTPException(status_code=400, detail="Arquivo muito grande (máx 20MB)")
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Formato inválido (aceito: PDF)")
    
    path = f"{APP_NAME}/despachos/{case_id}/{uuid.uuid4()}.pdf"
    data = await file.read()
    result = put_object(path, data, "application/pdf")
    
    await db.cases.update_one({"id": case_id}, {"$set": {"despacho_url": result["path"]}})
    
    return {"url": result["path"]}

@api_router.post("/upload/user-foto/{user_id}")
async def upload_user_foto(user_id: str, file: UploadFile = File(...), request: Request = None):
    current_user = await get_current_user(request)
    
    # Can only upload own photo or admin/super_admin can upload for others
    if current_user["id"] != user_id and current_user["tipo"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    if file.size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="Arquivo muito grande (máx 5MB)")
    
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Formato inválido (aceito: JPG, PNG)")
    
    path = f"{APP_NAME}/user-fotos/{user_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    
    await db.users.update_one({"id": user_id}, {"$set": {"foto_url": result["path"]}})
    
    return {"url": result["path"]}

@api_router.get("/files/{path:path}")
async def get_file(path: str, request: Request):
    await get_current_user(request)
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    await get_current_user(request)
    
    total = await db.cases.count_documents({})
    processados = await db.cases.count_documents({"status": "processado"})
    arquivados = await db.cases.count_documents({"status": "arquivado"})
    pendentes = await db.cases.count_documents({"status": "pendente"})
    em_processo = await db.cases.count_documents({"status": "em_processo"})
    anulados = await db.cases.count_documents({"status": "anulado"})
    masculino = await db.cases.count_documents({"sexo": "M"})
    feminino = await db.cases.count_documents({"sexo": "F"})
    
    # Cases by month (last 6 months)
    six_months_ago = (datetime.now(timezone.utc) - timedelta(days=180)).isoformat()
    pipeline = [
        {"$match": {"created_at": {"$gte": six_months_ago}}},
        {"$group": {
            "_id": {"$substr": ["$created_at", 0, 7]},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    monthly_data = await db.cases.aggregate(pipeline).to_list(12)
    
    # Cases by type
    type_pipeline = [
        {"$group": {"_id": "$tipo_caso", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    type_data = await db.cases.aggregate(type_pipeline).to_list(10)
    
    # Cases by unit
    unit_pipeline = [
        {"$group": {"_id": "$componente_unidade", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    unit_data = await db.cases.aggregate(unit_pipeline).to_list(10)
    
    return {
        "total": total,
        "processados": processados,
        "arquivados": arquivados,
        "pendentes": pendentes,
        "em_processo": em_processo,
        "anulados": anulados,
        "masculino": masculino,
        "feminino": feminino,
        "monthly": [{"month": m["_id"], "count": m["count"]} for m in monthly_data],
        "by_type": [{"tipo": t["_id"] or "Não especificado", "count": t["count"]} for t in type_data],
        "by_unit": [{"unidade": u["_id"] or "Não especificada", "count": u["count"]} for u in unit_data]
    }

# Activity Logs
@api_router.get("/activity-logs")
async def get_activity_logs(request: Request, page: int = 1, limit: int = 50):
    await require_roles("super_admin")(request)
    
    skip = (page - 1) * limit
    logs = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.activity_logs.count_documents({})
    
    return {"logs": logs, "total": total, "page": page, "limit": limit}

# Export Routes
@api_router.get("/export/cases")
async def export_cases(request: Request, format: str = "csv"):
    await require_roles("super_admin", "admin", "pessoal_justica")(request)
    
    cases = await db.cases.find({}, {"_id": 0}).to_list(10000)
    
    if format == "csv":
        import csv
        output = io.StringIO()
        if cases:
            writer = csv.DictWriter(output, fieldnames=cases[0].keys())
            writer.writeheader()
            writer.writerows(cases)
        content = output.getvalue()
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=casos.csv"}
        )
    elif format == "xlsx":
        import xlsxwriter
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        worksheet = workbook.add_worksheet("Casos")
        
        if cases:
            headers = list(cases[0].keys())
            for col, header in enumerate(headers):
                worksheet.write(0, col, header)
            
            for row, case in enumerate(cases, 1):
                for col, header in enumerate(headers):
                    worksheet.write(row, col, str(case.get(header, "")))
        
        workbook.close()
        output.seek(0)
        return Response(
            content=output.read(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=casos.xlsx"}
        )
    
    raise HTTPException(status_code=400, detail="Formato inválido")

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Sistema de Gestão Disciplinar - FALINTIL-FDTL"}

# Sanction Expiry Notifications - Check for sanctions ending in 5 days
@api_router.get("/notifications/expiring-sanctions")
async def get_expiring_sanctions(request: Request):
    """Get list of cases with sanctions expiring in 5 days or less"""
    await get_current_user(request)
    
    today = datetime.now(timezone.utc).date()
    five_days_later = today + timedelta(days=5)
    
    # Find all processed cases with data_fim within next 5 days
    cases = await db.cases.find(
        {"status": "processado", "data_fim": {"$ne": None}},
        {"_id": 0}
    ).to_list(1000)
    
    expiring_cases = []
    for case in cases:
        if case.get("data_fim"):
            try:
                data_fim = datetime.strptime(case["data_fim"], "%Y-%m-%d").date()
                days_remaining = (data_fim - today).days
                
                if 0 <= days_remaining <= 5:
                    expiring_cases.append({
                        "id": case["id"],
                        "numero": case["numero"],
                        "refere_ao": case["refere_ao"],
                        "posto": case["posto"],
                        "componente_unidade": case["componente_unidade"],
                        "tipo_sancao": case["tipo_sancao"],
                        "data_fim": case["data_fim"],
                        "dias_restantes": days_remaining
                    })
            except (ValueError, TypeError):
                continue
    
    # Sort by days remaining (closest first)
    expiring_cases.sort(key=lambda x: x["dias_restantes"])
    
    return {"notifications": expiring_cases, "count": len(expiring_cases)}

@api_router.get("/notifications/admin")
async def get_admin_notifications(request: Request):
    """Get action notifications for super_admin and admin users"""
    current_user = await get_current_user(request)
    if current_user["tipo"] not in ["super_admin", "admin"]:
        return {"notifications": [], "count": 0}
    
    notifications = await db.admin_notifications.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    unread_count = await db.admin_notifications.count_documents({"read": False})
    
    return {"notifications": notifications, "count": len(notifications), "unread_count": unread_count}

@api_router.put("/notifications/admin/mark-read")
async def mark_admin_notifications_read(request: Request):
    """Mark all admin notifications as read"""
    current_user = await get_current_user(request)
    if current_user["tipo"] not in ["super_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    await db.admin_notifications.update_many({"read": False}, {"$set": {"read": True}})
    return {"message": "Notificações marcadas como lidas"}

# Member History - Get all cases for a specific member
@api_router.get("/member-history/{nim}")
async def get_member_history(nim: str, request: Request):
    """Get complete case history for a member by NIM"""
    await get_current_user(request)
    
    cases = await db.cases.find(
        {"nim": nim},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Calculate summary
    summary = {
        "total_casos": len(cases),
        "processados": len([c for c in cases if c["status"] == "processado"]),
        "arquivados": len([c for c in cases if c["status"] == "arquivado"]),
        "pendentes": len([c for c in cases if c["status"] == "pendente"]),
        "anulados": len([c for c in cases if c["status"] == "anulado"]),
        "em_processo": len([c for c in cases if c["status"] == "em_processo"])
    }
    
    return {
        "nim": nim,
        "cases": cases,
        "summary": summary,
        "historico_limpo": len(cases) == 0
    }

# Search member by name for history
@api_router.get("/member-search")
async def search_member(request: Request, q: str = ""):
    """Search for members by name or NIM"""
    await get_current_user(request)
    
    if not q or len(q) < 2:
        return {"members": []}
    
    # Find distinct members
    pipeline = [
        {"$match": {
            "$or": [
                {"refere_ao": {"$regex": q, "$options": "i"}},
                {"nim": {"$regex": q, "$options": "i"}}
            ]
        }},
        {"$group": {
            "_id": "$nim",
            "nome": {"$first": "$refere_ao"},
            "posto": {"$first": "$posto"},
            "unidade": {"$first": "$componente_unidade"},
            "total_casos": {"$sum": 1}
        }},
        {"$limit": 20}
    ]
    
    results = await db.cases.aggregate(pipeline).to_list(20)
    
    return {
        "members": [
            {
                "nim": r["_id"],
                "nome": r["nome"],
                "posto": r["posto"],
                "unidade": r["unidade"],
                "total_casos": r["total_casos"]
            }
            for r in results if r["_id"]
        ]
    }

# Background task to check and update expired sanctions
async def check_expired_sanctions():
    """Check for expired sanctions and move them to 'anulado' status"""
    today = datetime.now(timezone.utc).date()
    today_str = today.strftime("%Y-%m-%d")
    
    # Find all processed cases with data_fim <= today
    cases = await db.cases.find(
        {"status": "processado", "data_fim": {"$ne": None}},
        {"_id": 0, "id": 1, "numero": 1, "data_fim": 1, "refere_ao": 1}
    ).to_list(1000)
    
    updated_count = 0
    for case in cases:
        if case.get("data_fim"):
            try:
                data_fim = datetime.strptime(case["data_fim"], "%Y-%m-%d").date()
                if data_fim <= today:
                    # Update status to anulado (sanção concluída)
                    await db.cases.update_one(
                        {"id": case["id"]},
                        {"$set": {
                            "status": "anulado",
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                            "motivo_anulacao": "Sanção concluída - prazo encerrado"
                        }}
                    )
                    await log_activity("system", "Sistema", "AUTO_EXPIRE", 
                        f"Caso {case['numero']} - sanção de {case['refere_ao']} concluída automaticamente")
                    updated_count += 1
            except (ValueError, TypeError):
                continue
    
    if updated_count > 0:
        logger.info(f"Auto-expired {updated_count} sanctions")
    
    return updated_count

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.cases.create_index("id", unique=True)
    await db.cases.create_index("numero", unique=True)
    await db.activity_logs.create_index("timestamp")
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "superadmin@falintil.tl")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@2024")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        admin = {
            "id": str(uuid.uuid4()),
            "nome": "Super Administrador",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "tipo": "super_admin",
            "foto_url": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info(f"Admin password updated")
    
    # Ensure local upload directory exists
    UPLOAD_DIR.mkdir(exist_ok=True)
    logger.info(f"Local file storage: {UPLOAD_DIR.resolve()}")
    
    # Seed demo data
    await seed_demo_data()
    
    # Check for expired sanctions on startup
    expired_count = await check_expired_sanctions()
    if expired_count > 0:
        logger.info(f"Moved {expired_count} expired sanctions to 'anulado'")
    
    # Start background task for periodic sanction check
    asyncio.create_task(periodic_sanction_check())
    
    logger.info("Sistema de Gestão Disciplinar iniciado")

async def periodic_sanction_check():
    """Periodically check for expired sanctions (every hour)"""
    while True:
        await asyncio.sleep(3600)  # Check every hour
        try:
            await check_expired_sanctions()
        except Exception as e:
            logger.error(f"Periodic sanction check failed: {e}")

async def seed_demo_data():
    """Seed demo users and cases"""
    
    # Demo users
    demo_users = [
        {"nome": "Carlos Santos", "email": "admin@falintil.tl", "tipo": "admin"},
        {"nome": "Maria Silva", "email": "justica@falintil.tl", "tipo": "pessoal_justica"},
        {"nome": "João Oliveira", "email": "superior@falintil.tl", "tipo": "pessoal_superior"},
    ]
    
    for u in demo_users:
        existing = await db.users.find_one({"email": u["email"]})
        if not existing:
            user = {
                "id": str(uuid.uuid4()),
                "nome": u["nome"],
                "email": u["email"],
                "password_hash": hash_password("Demo@2024"),
                "tipo": u["tipo"],
                "foto_url": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user)
    
    # Demo cases
    existing_cases = await db.cases.count_documents({})
    if existing_cases == 0:
        postos = ["Soldado", "Cabo", "Sargento", "Tenente", "Capitão", "Major", "Coronel"]
        unidades = ["1º Batalhão", "2º Batalhão", "3º Batalhão", "Comando Naval", "Força Aérea", "QG"]
        tipos_caso = ["Indisciplina", "Ausência sem licença", "Insubordinação", "Má conduta", "Negligência"]
        sancoes = ["Advertência", "Repreensão", "Detenção 5 dias", "Detenção 10 dias", "Detenção 15 dias", "Suspensão"]
        status_list = ["pendente", "em_processo", "processado", "arquivado", "anulado"]
        nomes = [
            "António Gusmão", "Manuel da Costa", "José Ramos", "Pedro Alves", 
            "Francisco Soares", "Carlos Martins", "Luis Pereira", "Ana Maria Santos",
            "Teresa Lopes", "Isabel Ferreira", "Ricardo Belo", "Armando Cruz"
        ]
        
        import random
        
        for i in range(15):
            case_date = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 180))
            status = random.choice(status_list)
            
            case = {
                "id": str(uuid.uuid4()),
                "numero": f"CASO-{datetime.now().year}-{str(i + 1).zfill(5)}",
                "data_registo": case_date.strftime("%Y-%m-%d"),
                "hora": f"{random.randint(8, 18):02d}:{random.randint(0, 59):02d}",
                "tipo_caso": random.choice(tipos_caso),
                "refere_ao": random.choice(nomes),
                "posto": random.choice(postos),
                "componente_unidade": random.choice(unidades),
                "requerente": "Comando",
                "telefone": f"77{random.randint(1000000, 9999999)}",
                "nim": f"F{random.randint(10000, 99999)}",
                "sexo": random.choice(["M", "M", "M", "M", "F"]),
                "status": status,
                "registrado_por": "Super Administrador",
                "registrado_por_id": "system",
                "foto_membro_url": None,
                "anexo_pdf_url": None,
                "despacho_url": None,
                "tipo_sancao": random.choice(sancoes) if status == "processado" else None,
                "data_despacho": case_date.strftime("%Y-%m-%d") if status in ["processado", "arquivado"] else None,
                "data_inicio": case_date.strftime("%Y-%m-%d") if status == "processado" else None,
                "data_fim": (case_date + timedelta(days=random.randint(5, 30))).strftime("%Y-%m-%d") if status == "processado" else None,
                "oficial_instrutor": random.choice(["Maj. Silva", "Cap. Costa", "Ten. Ramos"]) if status in ["processado", "em_processo"] else None,
                "observacao": "Caso registrado para demonstração" if status == "processado" else None,
                "created_at": case_date.isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.cases.insert_one(case)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
