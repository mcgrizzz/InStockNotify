FROM node

RUN apt-get update
RUN apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*



ENV PORT 8080
EXPOSE 8080

WORKDIR /code
COPY ./code .
RUN npm ci

# Run everything after as non-privileged user.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /code/node_modules \
    && chown -R pptruser:pptruser /code/scraper \
    && chown -R pptruser:pptruser /code/routes \
    && chown -R pptruser:pptruser /code/models \
    && chown -R pptruser:pptruser /code/package.json \
    && chown -R pptruser:pptruser /code/package-lock.json \
    && chown -R pptruser:pptruser /code/index.js

USER pptruser

RUN node /code/node_modules/puppeteer/install.js

CMD ["node", "index.js"]
