# Руководство по реализации системы уведомлений

## Обзор

Данное руководство описывает пошаговую реализацию автоматической системы уведомлений для пациентов при изменении их данных.

## Архитектура решения

```
┌─────────────────┐
│  Patient Update │
│   (API Layer)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Notification    │
│   Service       │
└────────┬────────┘
         │
         ├──────────────┐
         ▼              ▼
┌─────────────┐  ┌──────────────┐
│  Database   │  │ Push Service │
│ (Save notif)│  │ (Expo Push)  │
└─────────────┘  └──────────────┘
```

## Шаг 1: Схема базы данных

### Таблица notifications (если не существует)

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
);
```

### Таблица push_tokens

```sql
CREATE TABLE push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL, -- 'ios', 'android', 'web'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_token (token)
);
```

## Шаг 2: Модели данных

### Python (Django/FastAPI)

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class NotificationCreate(BaseModel):
    user_id: int
    patient_id: int
    title: str
    message: str
    type: str

class Notification(BaseModel):
    id: int
    user_id: int
    patient_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

class PushToken(BaseModel):
    id: int
    user_id: int
    token: str
    platform: str
    created_at: datetime
    updated_at: datetime
```

### TypeScript (Node.js)

```typescript
interface NotificationCreate {
  user_id: number;
  patient_id: number;
  title: string;
  message: string;
  type: string;
}

interface Notification {
  id: number;
  user_id: number;
  patient_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface PushToken {
  id: number;
  user_id: number;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
  updated_at: string;
}
```

## Шаг 3: Notification Service

### Python Implementation

```python
import requests
from typing import Optional, Dict, Any

class NotificationService:
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

    STATUS_LABELS = {
        'NEW': 'Новый',
        'PREPARATION': 'На подготовке',
        'REVIEW_NEEDED': 'Требуется проверка',
        'APPROVED': 'Одобрен',
        'SURGERY_SCHEDULED': 'Операция назначена',
        'COMPLETED': 'Завершен',
        'REJECTED': 'Отклонен'
    }

    OPERATION_LABELS = {
        'CATARACT': 'Факоэмульсификация катаракты',
        'ANTIGLAUCOMA': 'Антиглаукоматозная операция',
        'VITRECTOMY': 'Витрэктомия',
        'RETINAL_DETACHMENT': 'Операция при отслойке сетчатки',
        'CORNEAL_TRANSPLANT': 'Пересадка роговицы',
        'LASER_CORRECTION': 'Лазерная коррекция зрения'
    }

    EYE_LABELS = {
        'OD': 'правый глаз',
        'OS': 'левый глаз',
        'OU': 'оба глаза'
    }

    def __init__(self, db_session):
        self.db = db_session

    def create_notification(
        self,
        user_id: int,
        patient_id: int,
        title: str,
        message: str,
        notification_type: str
    ) -> Notification:
        """Create notification in database"""
        notification = Notification(
            user_id=user_id,
            patient_id=patient_id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def send_push_notification(
        self,
        user_id: int,
        title: str,
        body: str,
        data: Dict[str, Any]
    ) -> bool:
        """Send push notification via Expo"""
        # Get user's push tokens
        tokens = self.db.query(PushToken).filter(
            PushToken.user_id == user_id
        ).all()

        if not tokens:
            return False

        # Get unread notification count for badge
        unread_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

        success = True
        for token_obj in tokens:
            payload = {
                "to": token_obj.token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data,
                "badge": unread_count
            }

            try:
                response = requests.post(
                    self.EXPO_PUSH_URL,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
            except Exception as e:
                print(f"Failed to send push to {token_obj.token}: {e}")
                success = False

        return success

    def notify_status_change(
        self,
        patient_id: int,
        user_id: int,
        new_status: str
    ):
        """Create notification for status change"""
        title = "Статус изменен"
        message = f"Ваш статус изменен на: {self.STATUS_LABELS.get(new_status, new_status)}"

        notification = self.create_notification(
            user_id=user_id,
            patient_id=patient_id,
            title=title,
            message=message,
            notification_type="status_change"
        )

        self.send_push_notification(
            user_id=user_id,
            title=title,
            body=message,
            data={
                "patient_id": patient_id,
                "type": "status_change"
            }
        )

        return notification

    def notify_doctor_assigned(
        self,
        patient_id: int,
        user_id: int,
        doctor_name: str
    ):
        """Create notification for doctor assignment"""
        title = "Назначен лечащий врач"
        message = f"Вам назначен лечащий врач: {doctor_name}"

        notification = self.create_notification(
            user_id=user_id,
            patient_id=patient_id,
            title=title,
            message=message,
            notification_type="doctor_assigned"
        )

        self.send_push_notification(
            user_id=user_id,
            title=title,
            body=message,
            data={
                "patient_id": patient_id,
                "type": "doctor_assigned"
            }
        )

        return notification

    def notify_surgeon_assigned(
        self,
        patient_id: int,
        user_id: int,
        surgeon_name: str
    ):
        """Create notification for surgeon assignment"""
        title = "Назначен хирург"
        message = f"Вам назначен хирург: {surgeon_name}"

        notification = self.create_notification(
            user_id=user_id,
            patient_id=patient_id,
            title=title,
            message=message,
            notification_type="surgeon_assigned"
        )

        self.send_push_notification(
            user_id=user_id,
            title=title,
            body=message,
            data={
                "patient_id": patient_id,
                "type": "surgeon_assigned"
            }
        )

        return notification

    def notify_surgery_scheduled(
        self,
        patient_id: int,
        user_id: int,
        surgery_date: str
    ):
        """Create notification for surgery scheduling"""
        title = "Дата операции назначена"
        message = f"Ваша операция назначена на {surgery_date}"

        notification = self.create_notification(
            user_id=user_id,
            patient_id=patient_id,
            title=title,
            message=message,
            notification_type="surgery_scheduled"
        )

        self.send_push_notification(
            user_id=user_id,
            title=title,
            body=message,
            data={
                "patient_id": patient_id,
                "type": "surgery_scheduled"
            }
        )

        return notification
```

## Шаг 4: Интеграция в Patient Update Endpoint

### Python (FastAPI)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()

@router.patch("/api/v1/patients/{patient_id}")
async def update_patient(
    patient_id: int,
    update_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Initialize notification service
    notification_service = NotificationService(db)

    # Track changes and create notifications

    # 1. Status change
    if update_data.status and update_data.status != patient.status:
        old_status = patient.status
        patient.status = update_data.status

        notification_service.notify_status_change(
            patient_id=patient.id,
            user_id=patient.user_id,
            new_status=update_data.status
        )

    # 2. Doctor assignment
    if update_data.doctor_id and update_data.doctor_id != patient.doctor_id:
        doctor = db.query(User).filter(User.id == update_data.doctor_id).first()
        patient.doctor_id = update_data.doctor_id

        if doctor:
            notification_service.notify_doctor_assigned(
                patient_id=patient.id,
                user_id=patient.user_id,
                doctor_name=doctor.full_name
            )

    # 3. Surgeon assignment
    if update_data.surgeon_id and update_data.surgeon_id != patient.surgeon_id:
        surgeon = db.query(User).filter(User.id == update_data.surgeon_id).first()
        patient.surgeon_id = update_data.surgeon_id

        if surgeon:
            notification_service.notify_surgeon_assigned(
                patient_id=patient.id,
                user_id=patient.user_id,
                surgeon_name=surgeon.full_name
            )

    # 4. Surgery date
    if update_data.surgery_date and update_data.surgery_date != patient.surgery_date:
        patient.surgery_date = update_data.surgery_date

        notification_service.notify_surgery_scheduled(
            patient_id=patient.id,
            user_id=patient.user_id,
            surgery_date=update_data.surgery_date.strftime("%d %B %Y")
        )

    # 5. Diagnosis
    if update_data.diagnosis and update_data.diagnosis != patient.diagnosis:
        patient.diagnosis = update_data.diagnosis

        notification_service.create_notification(
            user_id=patient.user_id,
            patient_id=patient.id,
            title="Диагноз установлен",
            message=f"Установлен диагноз: {update_data.diagnosis}",
            notification_type="diagnosis_set"
        )

    # 6. Operation type
    if (update_data.operation_type and
        update_data.operation_type != patient.operation_type):
        patient.operation_type = update_data.operation_type

        operation_label = notification_service.OPERATION_LABELS.get(
            update_data.operation_type,
            update_data.operation_type
        )
        eye_label = notification_service.EYE_LABELS.get(
            patient.operation_eye or 'OD',
            'глаз'
        )

        notification_service.create_notification(
            user_id=patient.user_id,
            patient_id=patient.id,
            title="Тип операции определен",
            message=f"Назначена операция: {operation_label} ({eye_label})",
            notification_type="operation_type_set"
        )

    # Commit all changes
    db.commit()
    db.refresh(patient)

    return {"success": True, "data": patient}
```

## Шаг 5: Push Token Management

### Endpoint для регистрации токенов

```python
@router.post("/api/v1/push-tokens")
async def register_push_token(
    token_data: PushTokenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if token already exists
    existing = db.query(PushToken).filter(
        PushToken.token == token_data.token
    ).first()

    if existing:
        # Update user_id if changed
        existing.user_id = current_user.id
        existing.updated_at = datetime.utcnow()
        db.commit()
        return {"success": True, "data": existing}

    # Create new token
    push_token = PushToken(
        user_id=current_user.id,
        token=token_data.token,
        platform=token_data.platform
    )
    db.add(push_token)
    db.commit()
    db.refresh(push_token)

    return {"success": True, "data": push_token}
```

## Шаг 6: Тестирование

### Unit Tests

```python
import pytest
from unittest.mock import Mock, patch

def test_notify_status_change():
    # Setup
    db_mock = Mock()
    service = NotificationService(db_mock)

    # Execute
    notification = service.notify_status_change(
        patient_id=1,
        user_id=2,
        new_status='APPROVED'
    )

    # Assert
    assert notification.title == "Статус изменен"
    assert "Одобрен" in notification.message
    assert notification.type == "status_change"

def test_send_push_notification():
    # Setup
    db_mock = Mock()
    db_mock.query().filter().all.return_value = [
        PushToken(token="ExponentPushToken[xxx]", platform="ios")
    ]

    service = NotificationService(db_mock)

    # Execute
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        result = service.send_push_notification(
            user_id=2,
            title="Test",
            body="Test message",
            data={"patient_id": 1}
        )

    # Assert
    assert result == True
    mock_post.assert_called_once()
```

### Integration Tests

```python
def test_patient_update_creates_notification(client, db_session):
    # Create test patient
    patient = create_test_patient(db_session)

    # Update status
    response = client.patch(
        f"/api/v1/patients/{patient.id}",
        json={"status": "APPROVED"},
        headers={"Authorization": f"Bearer {get_test_token()}"}
    )

    assert response.status_code == 200

    # Check notification was created
    notifications = db_session.query(Notification).filter(
        Notification.patient_id == patient.id
    ).all()

    assert len(notifications) == 1
    assert notifications[0].type == "status_change"
    assert "Одобрен" in notifications[0].message
```

## Шаг 7: Мониторинг и логирование

### Добавить логирование

```python
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def create_notification(self, ...):
        try:
            notification = Notification(...)
            self.db.add(notification)
            self.db.commit()

            logger.info(
                f"Notification created: user_id={user_id}, "
                f"type={notification_type}, patient_id={patient_id}"
            )

            return notification
        except Exception as e:
            logger.error(
                f"Failed to create notification: {e}",
                exc_info=True
            )
            raise

    def send_push_notification(self, ...):
        try:
            # ... send logic
            logger.info(f"Push sent to user_id={user_id}")
        except Exception as e:
            logger.error(
                f"Failed to send push to user_id={user_id}: {e}",
                exc_info=True
            )
```

## Шаг 8: Оптимизация производительности

### Асинхронная отправка push-уведомлений

```python
from celery import Celery

celery_app = Celery('tasks', broker='redis://localhost:6379/0')

@celery_app.task
def send_push_notification_async(user_id, title, body, data):
    """Send push notification asynchronously"""
    service = NotificationService(get_db_session())
    service.send_push_notification(user_id, title, body, data)

# В коде:
notification_service.create_notification(...)
send_push_notification_async.delay(user_id, title, body, data)
```

## Чеклист реализации

- [ ] Создать таблицы `notifications` и `push_tokens`
- [ ] Реализовать `NotificationService` класс
- [ ] Добавить endpoint `POST /api/v1/notifications`
- [ ] Добавить endpoint `POST /api/v1/push-tokens`
- [ ] Интегрировать в `PATCH /api/v1/patients/{id}`
- [ ] Интегрировать в `POST /api/v1/comments`
- [ ] Интегрировать в другие endpoints (чек-листы, ИОЛ, медиа)
- [ ] Написать unit tests
- [ ] Написать integration tests
- [ ] Добавить логирование
- [ ] Настроить асинхронную отправку push
- [ ] Протестировать с реальными устройствами
- [ ] Задеплоить на staging
- [ ] Задеплоить на production

## Полезные ссылки

- [Expo Push Notifications API](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Expo Push Token Format](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Best Practices for Push Notifications](https://docs.expo.dev/push-notifications/faq/)
