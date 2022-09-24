FROM node:18-alpine

# Add fonts
RUN apk add fontconfig
WORKDIR /usr/share/fonts
ADD assets/fonts/*.ttf .
ADD assets/fonts/*.otf .
RUN fc-cache -fv

WORKDIR /app

ADD package.json .
ADD package-lock.json .
RUN npm install --omit=dev
RUN chown -R node:node /app

USER node

RUN mkdir assets/
ADD assets/images/ assets/images/
ADD dist/ dist/

EXPOSE 8080

CMD ["npm", "run", "start"]
