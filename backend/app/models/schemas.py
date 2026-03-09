from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID as pg_UUID
from sqlalchemy.orm import relationship
import uuid
import datetime
from pgvector.sqlalchemy import Vector
from app.core.database import Base

# Subscription plan tiers — mirrors Prisma PlanType enum
PLAN_LIMITS: dict[str, int] = {
    "FREE": 800_000,    # ~£30 Bedrock compute
    "BASIC": 1_600_000, # ~£40 limit on £20/mo plan
    "MAX": 3_200_000,   # ~£80 limit on £50/mo plan
}


class User(Base):
    __tablename__ = "users"
    id = Column(pg_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    # current_tier kept for migration compatibility; use `plan` going forward
    current_tier = Column(String, default="FREE", nullable=True)
    plan = Column(String, default="FREE", nullable=False)
    monthly_tokens = Column(Integer, default=0, nullable=False)
    tokens_reset_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=True)
    gdpr_consent = Column(Boolean, default=False, nullable=False)
    gdpr_consent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("ProfileDocument", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")

class ProfileDocument(Base):
    __tablename__ = "profile_documents"
    id = Column(pg_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(pg_UUID(as_uuid=True), ForeignKey("users.id"))
    filename = Column(String)
    raw_markdown = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="documents")
    chunks = relationship("ProfileChunk", back_populates="document")

class ProfileChunk(Base):
    __tablename__ = "profile_chunks"
    id = Column(pg_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(pg_UUID(as_uuid=True), ForeignKey("profile_documents.id"))
    chunk_text = Column(Text)
    embedding = Column(Vector(1536)) # Assuming Titan Embeddings V2 
    
    document = relationship("ProfileDocument", back_populates="chunks")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(pg_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(pg_UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    id = Column(pg_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(pg_UUID(as_uuid=True), ForeignKey("conversations.id"))
    role = Column(String) # user, assistant, system
    content = Column(Text)
    model_used = Column(String, nullable=True) # e.g., "anthropic.claude-v2"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    conversation = relationship("Conversation", back_populates="messages")
