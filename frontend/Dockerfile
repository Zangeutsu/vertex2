FROM node:20-alpine

WORKDIR /app

COPY package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js ./ 
COPY styles ./styles
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public

RUN npm install

EXPOSE 3000
CMD ["npm", "run", "dev"]
