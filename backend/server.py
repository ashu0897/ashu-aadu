from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== Models ==============

# Wedding Model
class WeddingBase(BaseModel):
    title: str
    bride_name: str
    groom_name: str
    wedding_date: str  # ISO date string
    location: Optional[str] = None

class WeddingCreate(WeddingBase):
    pass

class Wedding(WeddingBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Event Model
class EventBase(BaseModel):
    name: str
    budget: float = 0
    color: Optional[str] = None

class EventCreate(EventBase):
    wedding_id: str

class Event(EventBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wedding_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Expense Model
class ExpenseBase(BaseModel):
    name: str
    amount: float
    paid_by: str
    comment: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    event_id: str
    wedding_id: str

class Expense(ExpenseBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    wedding_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Task Model
class TaskBase(BaseModel):
    description: str
    event_id: str
    assigned_to: str
    due_date: str  # ISO date string
    notes: Optional[str] = None
    status: str = "pending"  # pending, in_progress, done

class TaskCreate(TaskBase):
    wedding_id: str

class Task(TaskBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wedding_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Person/Family Member Model
class PersonBase(BaseModel):
    name: str

class PersonCreate(PersonBase):
    wedding_id: str

class Person(PersonBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wedding_id: str

# ============== Wedding Routes ==============

@api_router.post("/weddings", response_model=Wedding)
async def create_wedding(wedding: WeddingCreate):
    wedding_obj = Wedding(**wedding.model_dump())
    doc = wedding_obj.model_dump()
    await db.weddings.insert_one(doc)
    return wedding_obj

@api_router.get("/weddings", response_model=List[Wedding])
async def get_weddings():
    weddings = await db.weddings.find({}, {"_id": 0}).to_list(100)
    return weddings

@api_router.get("/weddings/{wedding_id}", response_model=Wedding)
async def get_wedding(wedding_id: str):
    wedding = await db.weddings.find_one({"id": wedding_id}, {"_id": 0})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    return wedding

@api_router.put("/weddings/{wedding_id}", response_model=Wedding)
async def update_wedding(wedding_id: str, wedding: WeddingCreate):
    existing = await db.weddings.find_one({"id": wedding_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    update_data = wedding.model_dump()
    await db.weddings.update_one({"id": wedding_id}, {"$set": update_data})
    updated = await db.weddings.find_one({"id": wedding_id}, {"_id": 0})
    return updated

# Countdown image storage
class CountdownImageUpdate(BaseModel):
    image_url: str

@api_router.put("/weddings/{wedding_id}/countdown-image")
async def update_countdown_image(wedding_id: str, data: CountdownImageUpdate):
    existing = await db.weddings.find_one({"id": wedding_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Wedding not found")
    
    await db.weddings.update_one({"id": wedding_id}, {"$set": {"countdown_image": data.image_url}})
    return {"message": "Countdown image updated", "image_url": data.image_url}

@api_router.get("/weddings/{wedding_id}/countdown-image")
async def get_countdown_image(wedding_id: str):
    wedding = await db.weddings.find_one({"id": wedding_id}, {"_id": 0, "countdown_image": 1})
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    return {"image_url": wedding.get("countdown_image", "")}

@api_router.delete("/weddings/{wedding_id}")
async def delete_wedding(wedding_id: str):
    result = await db.weddings.delete_one({"id": wedding_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wedding not found")
    # Also delete related data
    await db.events.delete_many({"wedding_id": wedding_id})
    await db.expenses.delete_many({"wedding_id": wedding_id})
    await db.tasks.delete_many({"wedding_id": wedding_id})
    await db.people.delete_many({"wedding_id": wedding_id})
    return {"message": "Wedding deleted successfully"}

# ============== Event Routes ==============

@api_router.post("/events", response_model=Event)
async def create_event(event: EventCreate):
    event_obj = Event(**event.model_dump())
    doc = event_obj.model_dump()
    await db.events.insert_one(doc)
    return event_obj

@api_router.get("/weddings/{wedding_id}/events", response_model=List[Event])
async def get_events(wedding_id: str):
    events = await db.events.find({"wedding_id": wedding_id}, {"_id": 0}).to_list(100)
    return events

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event: EventBase):
    existing = await db.events.find_one({"id": event_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event.model_dump()
    await db.events.update_one({"id": event_id}, {"$set": update_data})
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})
    return updated

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    # Delete related expenses
    await db.expenses.delete_many({"event_id": event_id})
    return {"message": "Event deleted successfully"}

# ============== Expense Routes ==============

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    expense_obj = Expense(**expense.model_dump())
    doc = expense_obj.model_dump()
    await db.expenses.insert_one(doc)
    return expense_obj

@api_router.get("/weddings/{wedding_id}/expenses", response_model=List[Expense])
async def get_expenses(wedding_id: str):
    expenses = await db.expenses.find({"wedding_id": wedding_id}, {"_id": 0}).to_list(1000)
    return expenses

@api_router.get("/events/{event_id}/expenses", response_model=List[Expense])
async def get_event_expenses(event_id: str):
    expenses = await db.expenses.find({"event_id": event_id}, {"_id": 0}).to_list(1000)
    return expenses

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}

# ============== Task Routes ==============

@api_router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    task_obj = Task(**task.model_dump())
    doc = task_obj.model_dump()
    await db.tasks.insert_one(doc)
    return task_obj

@api_router.get("/weddings/{wedding_id}/tasks", response_model=List[Task])
async def get_tasks(wedding_id: str):
    tasks = await db.tasks.find({"wedding_id": wedding_id}, {"_id": 0}).to_list(1000)
    return tasks

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task: TaskBase):
    existing = await db.tasks.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task.model_dump()
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    updated = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return updated

# Full task update endpoint
class TaskUpdate(BaseModel):
    description: str
    event_id: str
    assigned_to: str
    due_date: str
    notes: Optional[str] = None
    status: str = "pending"

@api_router.put("/tasks/{task_id}/full", response_model=Task)
async def update_task_full(task_id: str, task: TaskUpdate):
    existing = await db.tasks.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task.model_dump()
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    updated = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return updated

@api_router.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status: str):
    existing = await db.tasks.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.update_one({"id": task_id}, {"$set": {"status": status}})
    updated = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return updated

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# ============== Person Routes ==============

@api_router.post("/people", response_model=Person)
async def create_person(person: PersonCreate):
    person_obj = Person(**person.model_dump())
    doc = person_obj.model_dump()
    await db.people.insert_one(doc)
    return person_obj

@api_router.get("/weddings/{wedding_id}/people", response_model=List[Person])
async def get_people(wedding_id: str):
    people = await db.people.find({"wedding_id": wedding_id}, {"_id": 0}).to_list(100)
    return people

@api_router.delete("/people/{person_id}")
async def delete_person(person_id: str):
    result = await db.people.delete_one({"id": person_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Person not found")
    return {"message": "Person deleted successfully"}

# ============== Dashboard Stats ==============

@api_router.get("/weddings/{wedding_id}/stats")
async def get_wedding_stats(wedding_id: str):
    # Get all events
    events = await db.events.find({"wedding_id": wedding_id}, {"_id": 0}).to_list(100)
    
    # Get all expenses
    expenses = await db.expenses.find({"wedding_id": wedding_id}, {"_id": 0}).to_list(1000)
    
    # Calculate totals
    total_budget = sum(e.get("budget", 0) for e in events)
    total_spent = sum(e.get("amount", 0) for e in expenses)
    
    # Calculate per event
    event_stats = []
    for event in events:
        event_expenses = [e for e in expenses if e.get("event_id") == event.get("id")]
        spent = sum(e.get("amount", 0) for e in event_expenses)
        event_stats.append({
            "id": event.get("id"),
            "name": event.get("name"),
            "budget": event.get("budget", 0),
            "spent": spent,
            "remaining": event.get("budget", 0) - spent,
            "color": event.get("color")
        })
    
    return {
        "total_budget": total_budget,
        "total_spent": total_spent,
        "remaining": total_budget - total_spent,
        "event_stats": event_stats
    }

# Health check
@api_router.get("/")
async def root():
    return {"message": "Shaadi Planner API is running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
