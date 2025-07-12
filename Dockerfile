# Basis-Image
FROM node:20

# System-Abhängigkeiten und Fonts installieren
RUN apt-get update && apt-get install -y \
    fontconfig \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

# Arbeitsverzeichnis setzen
WORKDIR /app

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Projektdateien kopieren
COPY . .

# Port freigeben
EXPOSE 3000

# Startkommando
CMD ["npm", "start"]
