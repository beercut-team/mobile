# Seed Scripts

Скрипты для наполнения базы данных тестовыми данными.

## Быстрый старт

```bash
# Запустить все скрипты одной командой
node scripts/seed-all.js admin@gmail.com 123123123
```

## Отдельные скрипты

### 1. Получить JWT токен
```bash
./scripts/get-token.sh admin@gmail.com 123123123
```

### 2. Добавить пациентов
```bash
node scripts/seed-patients.js <JWT_TOKEN>
```

Создает 5 тестовых пациентов:
- Иван Петров (катаракта OD, факоэмульсификация)
- Мария Смирнова (глаукома OU, антиглаукомная)
- Александр Козлов (отслойка сетчатки OS, витрэктомия)
- Елена Волкова (катаракта OS)
- Николай Морозов (катаракта OD)

### 3. Добавить комментарии
```bash
node scripts/seed-comments.js <JWT_TOKEN>
```

Создает 10 комментариев для пациентов, включая срочные (🔴).

### 4. Добавить расчеты ИОЛ
```bash
node scripts/seed-iol.js <JWT_TOKEN>
```

Создает 7 расчетов ИОЛ с разными формулами (SRK/T, Haigis, Hoffer Q).

### 5. Обновить статусы пациентов
```bash
node scripts/update-statuses.js <JWT_TOKEN>
```

Обновляет статусы пациентов для демонстрации workflow:
- Patient #5: APPROVED
- Patient #6: SURGERY_SCHEDULED
- Patient #7: PREPARATION
- Patient #8: REVIEW_NEEDED
- Patient #9: REVIEW_NEEDED

### 6. Обновить чеклисты (опционально)
```bash
node scripts/seed-checklists.js <JWT_TOKEN>
```

Обновляет чеклисты пациентов с разным процентом выполнения.

## Что было создано

После выполнения всех скриптов в базе данных:

- ✅ **5 пациентов** с полными данными (паспорт, СНИЛС, диагноз)
- ✅ **10 комментариев** (включая срочные)
- ✅ **7 расчетов ИОЛ** (3 формулы для разных пациентов)
- ✅ **5 обновлений статусов** (демонстрация workflow)

## API Endpoints

Все скрипты используют API: `https://api.beercut.tech`

### Авторизация
- POST `/api/v1/auth/login` - получить JWT токен

### Пациенты
- POST `/api/v1/patients` - создать пациента
- POST `/api/v1/patients/:id/status` - обновить статус

### Комментарии
- POST `/api/v1/comments` - создать комментарий

### ИОЛ
- POST `/api/v1/iol/calculate` - рассчитать ИОЛ

### Чеклисты
- GET `/api/v1/checklists/patient/:id` - получить чеклист
- PATCH `/api/v1/checklists/:id` - обновить пункт чеклиста
