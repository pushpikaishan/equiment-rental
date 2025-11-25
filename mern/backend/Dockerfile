FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies (use package-lock if present)
COPY package*.json ./

# Install only production deps to keep image small; if you need dev deps for build steps, change accordingly
RUN npm install --production

# Copy app source
COPY . .

# Ensure uploads folder exists
RUN mkdir -p /usr/src/app/uploads

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Use node for production (the package.json start uses nodemon for dev)
CMD ["node", "app.js"]
