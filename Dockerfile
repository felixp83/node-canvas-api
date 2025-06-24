FROM node:20

# Systemabhängigkeiten für node-canvas und Fontconfig inkl. Fonts
RUN apt-get update && apt-get install -y \
  fontconfig \
  fontconfig-config \
  fonts-dejavu-core \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
