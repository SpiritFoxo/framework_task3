FROM node:20-alpine

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем package.json отдельно — слой кэшируется, если зависимости не менялись
COPY package.json ./

# Зависимостей нет, но npm ci корректно отработает
RUN npm ci --ignore-scripts 2>/dev/null || true

# Копируем остальные файлы проекта
COPY config/ ./config/
COPY src/    ./src/

# Порт по умолчанию; можно переопределить через APP_PORT
EXPOSE 3000

# Настройки можно задавать переменными окружения:
#   APP_MODE, APP_PORT, APP_TRUSTED_ORIGINS, APP_READ_PER_MINUTE, APP_WRITE_PER_MINUTE
ENV APP_MODE=учебный

CMD ["node", "src/server.js"]
