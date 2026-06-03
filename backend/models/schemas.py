"""Pydantic models for request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class MaterialMode(str, Enum):
    URL = "url"
    DRAFT = "draft"
    TOPIC = "topic"


class FetchMaterialRequest(BaseModel):
    mode: MaterialMode
    url: Optional[str] = None
    text: Optional[str] = None
    topic: Optional[str] = None


class FetchMaterialResponse(BaseModel):
    content: str
    title: Optional[str] = None
    source: str


class GuideAnswers(BaseModel):
    audience: Optional[str] = None
    goal: Optional[str] = None
    conflict: Optional[str] = None
    conflict_type: Optional[str] = None
    constraints: Optional[str] = None
    feedback: Optional[str] = None


class MaterialCardSchema(BaseModel):
    core_topic: str = Field(alias="coreTopic")
    key_data: List[str] = Field(default_factory=list, alias="keyData")
    cases: List[str] = Field(default_factory=list)
    controversies: List[str] = Field(default_factory=list)
    golden_quote: str = Field(alias="goldenQuote")


class ExtractMaterialRequest(BaseModel):
    raw_material: str
    guide_answers: Optional[dict] = None


class DeconstructRequest(BaseModel):
    material_card: dict


class DeconstructResult(BaseModel):
    fuzzy_terms: List[dict] = Field(default_factory=list, alias="fuzzyTerms")
    replacements: List[dict] = Field(default_factory=list)
    genre: str = ""
    note: Optional[str] = None


class TitleRequest(BaseModel):
    material_card: dict
    deconstruct_result: Optional[dict] = None


class TitleCard(BaseModel):
    text: str
    trigger: str
    driving_force: str = Field(alias="drivingForce")
    recommended: bool = False


class TitleGeneration(BaseModel):
    titles: List[TitleCard]
    trigger_coverage: List[str] = Field(default_factory=list, alias="triggerCoverage")


class ArticleRequest(BaseModel):
    title: str
    material_card: dict
    deconstruct_result: Optional[dict] = None
    word_count: int = 3000


class DiagnosisRequest(BaseModel):
    article: str
    title: str


class DimensionResult(BaseModel):
    name: str
    verdict: str
    issues: List[str] = Field(default_factory=list)
    suggestion: str = ""


class DiagnosisReport(BaseModel):
    dimensions: List[DimensionResult] = Field(default_factory=list)
    first_action: dict = Field(default_factory=dict, alias="firstAction")


class HookVersion(BaseModel):
    method: str
    label: str
    text: str
    recommended: bool = False
    six_checks: dict = Field(default_factory=dict, alias="sixChecks")


class AiSignal(BaseModel):
    id: int
    feature: str
    level: str
    description: str
    location: str
    suggestion: str


class AiCheckResult(BaseModel):
    signals: List[AiSignal] = Field(default_factory=list)
    strong_count: int = Field(alias="strongCount")
    medium_count: int = Field(alias="mediumCount")
    weak_count: int = Field(alias="weakCount")


class HookRequest(BaseModel):
    article: str


class AiCheckRequest(BaseModel):
    article: str


class FixRequest(BaseModel):
    article: str
    title: str
    diagnosis: dict
    cycle: int = 1  # which fix cycle this is (1=first, 2=second, max 3)


class ExportDocxRequest(BaseModel):
    article: str
    title: str
    images: Optional[List[str]] = None
