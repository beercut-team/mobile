# Спецификация API уведомлений

## Обзор

Данный документ описывает требования к API для автоматического создания уведомлений при изменении данных пациента. Уведомления должны создаваться автоматически на бэкенде при любых изменениях данных пациента.

## API Endpoint

### Создание уведомления

```
POST /api/v1/notifications
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": 2,
  "patient_id": 2,
"title": "Статус изменен",
  "message": "Ваш статус изменен на: На подготовке",
  "type": "status_change"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": 2,
    "patient_id": 2,
    "title": "Статус изменен",
    "message": "Ваш статус изменен на: На подготовке",
    "type": "status_change",
    "is_read": false,
    "created_at": "2026-02-26T10:30:00Z"
  }
}
```

**Response: 400 Bad Request**
```json
{
  "success": false,
  "error": "Invalid request body"
}
```

## Типы уведомлений

| Type | Trigger Event | Title | Message Template |
|------|--------------|-------|------------------|
| `status_change` | Изменение статуса пациента | "Статус изменен" | "Ваш статус изменен на: {status_label}" |
| `doctor_assigned` | Назначение лечащего врача | "Назначен лечащий врач" | "Вам назначен лечащий врач: {doctor_name}" |
| `surgeon_assigned` | Назначение хирурга | "Назначен хирург" | "Вам назначен хирург: {surgeon_name}" |
| `surgery_scheduled` | Назначение даты операции | "Дата операции назначена" | "Ваша операция назначена на {date}" |
| `diagnosis_set` | Установка/изменение диагноза | "Диагноз установлен" | "Установлен диагноз: {diagnosis}" |
| `operation_type_set` | Установка типа операции | "Тип операции определен" | "Назначена операция: {operation_label} ({eye_label})" |
| `comment` | Добавление комментария | "Новый комментарий" | "{author_name}: {comment_text}" |
| `checklist_update` | Обновление чек-листа | "Обновлен чек-лист" | "Обновлен пункт: {item_name}" |
| `iol_calculation` | Расчет ИОЛ | "Расчет ИОЛ завершен" | "Выполнен расчет по формуле {formula}: {power}D" |
| `media_uploaded` | Загрузка документа | "Загружен документ" | "Добавлен документ: {filename}" |

### Маппинг статусов

```javascript
const STATUS_LABELS = {
  'NEW': 'Новый',
  'PREPARATION': 'На подготовке',
  'REVIEW_NEEDED': 'Требуется проверка',
  'APPROVED': 'Одобрен',
  'SURGERY_SCHEDULED': 'Операция назначена',
  'COMPLETED': 'Завершен',
  'REJECTED': 'Отклонен'
};
```

### Маппинг типов операций

```javascript
const OPERATION_LABELS = {
  'CATARACT': 'Факоэмульсификация катаракты',
  'ANTIGLAUCOMA': 'Антиглаукоматозная операция',
  'VITRECTOMY': 'Витрэктомия',
  'RETINAL_DETACHMENT': 'Операция при отслойке сетчатки',
  'CORNEAL_TRANSPLANT': 'Пересадка роговицы',
  'LASER_CORRECTION': 'Лазерная коррекция зрения'
};

const EYE_LABELS = {
  'OD': 'правый глаз',
  'OS': 'левый глаз',
  'OU': 'оба глаза'
};
```

## События-триггеры

Уведомления должны создаваться автоматически при следующих событиях:

### 1. Изменение статуса пациента
**Endpoint:** `PATCH /api/v1/patients/{id}`
**Поле:** `status`
**Notification type:** `status_change`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Статус изменен",
  "message": "Ваш статус изменен на: На подготовке",
  "type": "status_change"
}
```

### 2. Назначение лечащего врача
**Endpoint:** `PATCH /api/v1/patients/{id}`
**Поле:** `doctor_id`
**Notification type:** `doctor_assigned`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Назначен лечащий врач",
  "message": "Вам назначен лечащий врач: Николаев Айсен Петрович",
  "type": "doctor_assigned"
}
```

### 3. Назначение хирурга
**Endpoint:** `PATCH /api/v1/patients/{id}`
**Поле:** `surgeon_id`
**Notification type:** `surgeon_assigned`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Назначен хирург",
  "message": "Вам назначен хирург: Васильев Ньургун Иванович",
  "type": "surgeon_assigned"
}
```

### 4. Назначение даты операции
**Endpoint:** `PATCH /api/v1/patients/{id}`
**Поле:** `surgery_date`
**Notification type:** `surgery_scheduled`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Дата операции назначена",
  "message": "Ваша операция назначена на 11 ноября 2026",
  "type": "surgery_scheduled"
}
```

### 5. Установка диагноза
**Endpoint:** `PATCH /api/v1/patients/{id}`
**Поле:** `diagnosis`
**Notification type:** `diagnosis_set`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Диагноз установлен",
  "message": "Установлен диагноз: Открытоугольная глаукома II стадии",
  "type": "diagnosis_set"
}
```

### 6. Установка типа операции
**Endpoint:** `PATCH /api/v1/patients/{id}`
**Поля:** `operation_type`, `operation_eye`
**Notification type:** `operation_type_set`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Тип операции определен",
  "message": "Назначена операция: Антиглаукоматозная операция (левый глаз)",
  "type": "operation_type_set"
}
```

### 7. Добавление комментария
**Endpoint:** `POST /api/v1/comments`
**Notification type:** `comment`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Новый комментарий",
  "message": "Николаев Айсен: Пожалуйста, сдайте анализы крови до 5 марта",
  "type": "comment"
}
```

**Примечание:** Не создавать уведомление, если автор комментария = пациент (чтобы не уведомлять самого себя).

### 8. Обновление чек-листа
**Endpoint:** `PATCH /api/v1/checklists/{id}/items/{item_id}`
**Notification type:** `checklist_update`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Обновлен чек-лист",
  "message": "Обновлен пункт: Общий анализ крови",
  "type": "checklist_update"
}
```

### 9. Расчет ИОЛ
**Endpoint:** `POST /api/v1/iol-calculations`
**Notification type:** `iol_calculation`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Расчет ИОЛ завершен",
  "message": "Выполнен расчет по формуле SRKT: 21.5D",
  "type": "iol_calculation"
}
```

### 10. Загрузка документа
**Endpoint:** `POST /api/v1/media`
**Notification type:** `media_uploaded`

```json
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Загружен документ",
  "message": "Добавлен документ: Результаты анализов.pdf",
  "type": "media_uploaded"
}
```

## Логика создания уведомлений

### Псевдокод

```python
def update_patient(patient_id, update_data):
    patient = get_patient(patient_id)

    # Проверяем каждое изменяемое поле
    if 'status' in update_data and update_data['status'] != patient.status:
        old_status = patient.status
        new_status = update_data['status']

        # Обновляем пациента
        patient.status = new_status
        patient.save()

        # Создаем уведомление
        create_notification(
            user_id=patient.user_id,
            patient_id=patient.id,
            title="Статус изменен",
            message=f"Ваш статус изменен на: {STATUS_LABELS[new_status]}",
            type="status_change"
        )

        # Отправляем push-уведомление
        send_push_notification(
            user_id=patient.user_id,
            title="Статус изменен",
            body=f"Ваш статус изменен на: {STATUS_LABELS[new_status]}",
            data={
                "patient_id": patient.id,
                "type": "status_change"
            }
        )

    if 'doctor_id' in update_data and update_data['doctor_id'] != patient.doctor_id:
        doctor = get_user(update_data['doctor_id'])
        patient.doctor_id = doctor.id
        patient.save()

        create_notification(
            user_id=patient.user_id,
            patient_id=patient.id,
            title="Назначен лечащий врач",
            message=f"Вам назначен лечащий врач: {doctor.full_name}",
            type="doctor_assigned"
        )

        send_push_notification(
            user_id=patient.user_id,
            title="Назначен лечащий врач",
            body=f"Вам назначен лечащий врач: {doctor.full_name}",
            data={
                "patient_id": patient.id,
                "type": "doctor_assigned"
            }
        )

    # ... аналогично для других полей
```

## Интеграция с Push-уведомлениями

При создании уведомления в БД также необходимо отправить push-уведомление на устройство пользователя через Expo Push Notification Service.

### Формат push-уведомления

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "sound": "default",
  "title": "Статус изменен",
  "body": "Ваш статус изменен на: На подготовке",
  "data": {
    "patient_id": 2,
    "type": "status_change"
  },
  "badge": 1
}
```

### Получение Expo Push Token

Push token пользователя должен храниться в БД и обновляться при каждом входе в приложение. Фронтенд отправляет token через:

```
POST /api/v1/push-tokens
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

## Требования к реализации

1. **Атомарность:** Создание уведомления и отправка push должны быть в одной транзакции с обновлением данных пациента
2. **Идемпотентность:** Не создавать дубликаты уведомлений при повторных запросах
3. **Производительность:** Отправка push-уведомлений должна быть асинхронной (через очередь)
4. **Логирование:** Логировать все созданные уведомления и ошибки отправки push
5. **Фильтрация:** Не создавать уведомления для действий самого пациента (например, комментарии)

## Тестирование

### Сценарий 1: Изменение статуса
1. Создать пациента со статусом NEW
2. Обновить статус на PREPARATION через `PATCH /api/v1/patients/{id}`
3. Проверить, что создано уведомление типа `status_change`
4. Проверить, что отправлено push-уведомление
5. Войти в приложение как пациент
6. Проверить, что уведомление отображается в списке

### Сценарий 2: Назначение врача
1. Создать пациента без врача
2. Назначить врача через `PATCH /api/v1/patients/{id}`
3. Проверить, что создано уведомление типа `doctor_assigned`
4. Проверить, что в сообщении указано ФИО врача

### Сценарий 3: Множественные изменения
1. Обновить несколько полей одновременно (status + doctor_id)
2. Проверить, что создано 2 уведомления
3. Проверить, что оба уведомления имеют правильный тип и текст

## Примеры полных payload'ов

### Пример 1: Полный жизненный цикл пациента

```json
// 1. Статус NEW → PREPARATION
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Статус изменен",
  "message": "Ваш статус изменен на: На подготовке",
  "type": "status_change"
}

// 2. Назначен врач
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Назначен лечащий врач",
  "message": "Вам назначен лечащий врач: Николаев Айсен Петрович",
  "type": "doctor_assigned"
}

// 3. Установлен диагноз
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Диагноз установлен",
  "message": "Установлен диагноз: Открытоугольная глаукома II стадии",
  "type": "diagnosis_set"
}

// 4. Установлен тип операции
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Тип операции определен",
  "message": "Назначена операция: Антиглаукоматозная операция (левый глаз)",
  "type": "operation_type_set"
}

// 5. Назначен хирург
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Назначен хирург",
  "message": "Вам назначен хирург: Васильев Ньургун Иванович",
  "type": "surgeon_assigned"
}

// 6. Статус PREPARATION → REVIEW_NEEDED
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Статус изменен",
  "message": "Ваш статус изменен на: Требуется проверка",
  "type": "status_change"
}

// 7. Добавлен комментарий
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Новый комментарий",
  "message": "Николаев Айсен: Пожалуйста, сдайте анализы крови до 5 марта",
  "type": "comment"
}

// 8. Статус REVIEW_NEEDED → APPROVED
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Статус изменен",
  "message": "Ваш статус изменен на: Одобрен",
  "type": "status_change"
}

// 9. Назначена дата операции
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Дата операции назначена",
  "message": "Ваша операция назначена на 11 ноября 2026",
  "type": "surgery_scheduled"
}

// 10. Создан чек-лист
{
  "user_id": 2,
  "patient_id": 2,
  "title": "Обновлен чек-лист",
  "message": "Создан предоперационный чек-лист",
  "type": "checklist_update"
}
```

## Вопросы для обсуждения

1. Нужно ли создавать уведомления для изменений, сделанных самим пациентом?
2. Нужно ли ограничивать количество уведомлений (например, не более 1 уведомления в минуту)?
3. Нужно ли группировать уведомления (например, "3 изменения в вашей карте")?
4. Какой TTL для push-уведомлений (сколько времени хранить, если устройство оффлайн)?
5. Нужно ли отправлять email-уведомления в дополнение к push?
