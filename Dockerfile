FROM node:20

# Systemabhängigkeiten installieren, inkl. fontconfig für node-canvas
RUN apt-get update && apt-get install -y \
    fontconfig \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

# Sicherstellen, dass die Fontconfig-Konfigurationsdatei da ist (falls nötig)
RUN mkdir -p /etc/fonts && \
    cp /etc/fonts/fonts.conf /etc/fonts/fonts.conf || true

WORKDIR /app

COPY . /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
