FROM node:22-alpine
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev libusb-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --force
COPY . .
ENV VITE_SQUID_INTEGRATOR_ID=squid-swap-widget
ENV VITE_CONTRACT_ADDRESS=0x1A6FBc7b51E55C6D4F15c8D5CE7e97daEA699ecf
ENV VITE_PROJECT_ID=cb2f490d219d3ae517e5da175d402351
ENV VITE_API_URL=https://api.subsidios.reficolombia.org
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
