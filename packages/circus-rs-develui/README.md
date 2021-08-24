# CIRCU RS: development ui

This is the web ui for development of the `circus-rs` ui components.

**IMPORTANT**

Don't include this package when you create a PR.  


## Example to use

1. Prepare working directory as out of circus-repository, but under mono-repository.

   ```
   # On monorepo root
   $ git remote add fork git@github.com:genkn/circus.git
   $ git fetch fork rs-develui
   $ git checkout fork/rs-develui packages/circus-rs-develui

   $ rm -rf node_modules && rm -rf packages/*/node_modules
   $ npm ci
   $ echo "/packages/circus-rs-develui" >> .git/info/exclude
   ```

2. Set sample data to enable to mask and label.

   ```
   # On monorepo root
   $ mkdir -p ./packages/circus-rs-develui/public/sampledata
   $ cp ~/some/where/candidates.json ./packages/circus-rs-develui/public/sampledata/
   $ cp ~/some/where/cand1.raw ./packages/circus-rs-develui/public/sampledata/
   $ cp ~/some/where/cand2.raw ./packages/circus-rs-develui/public/sampledata/
   $ cp ~/some/where/cand3.raw ./packages/circus-rs-develui/public/sampledata/
   $ cp ~/some/where/vessel_mask.raw ./packages/circus-rs-develui/public/sampledata/
   ```

3. (Console 1) Start rs-server of `circus-rs` like this.

   ```
   # On monorepo root
   $ cd ./packages/circus-rs
   $ npm start
   ```

4. (Console 2) Start webpack-dev-server of `circus-rs-develui` like this.

   This sample uses environment varaiable, `DEVSERVER_HOST`, to access from anywhere.
   And set `DEVSERVER_PORT` to use 8081 port.

   ```
   # On monorepo root
   $ cd ./packages/circus-rs-develui
   $ DEVSERVER_HOST=0.0.0.0 DEVSERVER_PORT=8081 npm run devserver
   ```
