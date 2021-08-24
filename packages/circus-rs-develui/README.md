# CIRCU RS: vr demo

This is the web ui for development of the `circus-rs` ui components.

**IMPORTANT**

Don't include this package when you create a PR.  

## Example to use

1. Prepare working directory as out of circus-repository, but under mono-repository.

   ```
   $ cd ~/some/where/your-circus-mono-repo
   $ echo "/packages/circus-rs-develui" >> .git/info/exclude
   $ git clone git@github.com:utrad-ical/circus-rs-develui.git packages/circus-rs-develui
   $ npx lerna bootstrap --hoist --ci
   ```

2. Set sample data to enable to mask and label.

   ```
   $ cd ~/some/where/your-circus-mono-repo
   $ mkdir -p ./packages/circus-rs-develui/public/sampledata
   $ cp ~/some/where/candidates.json ./packages/circus-rs-develui/public/sampledata/
   $ cp ~/some/where/cand1.raw ./packages/circus-rs-develui/public/sampledata/
   $ cp ~/some/where/cand2.raw ./packages/circus-rs-develui/public/sampledata/
   $ cp ~/some/where/cand3.raw ./packages/circus-rs-develui/public/sampledata/
   $ cp ~/some/where/vessel_mask.raw ./packages/circus-rs-develui/public/sampledata/
   ```

3. (Console 1) Start rs-server of `circus-rs` like this.

   ```
   $ cd ~/some/where/your-circus-mono-repo/packages/circus-rs
   $ npm start
   ```

4. (Console 2) Start webpack-dev-server of `circus-rs-develui` like this.

   This sample uses environment varaiable, `DEVSERVER_HOST`, to access from anywhere.
   And set `DEVSERVER_PORT` to use 8081 port.

   ```
   $ cd ~/some/where/your-circus-mono-repo/packages/circus-rs-develui
   $ DEVSERVER_HOST=0.0.0.0 DEVSERVER_PORT=8081 npm run devserver
   ```

## TO AVOID "Invalid hook call." 18 May 2021

Maybe this problem occurs when there are multiple different react versions.

I tried the following and it solved the problem.

```sh
perl -pi -e 's#"react": ".+?"#"react": "^17.0.2"#;' \
         -e 's#"react-dom": ".+?"#"react-dom": "^17.0.2"#;' \
         -e 's#"@types/react": ".+?"#"@types/react": "^17.0.5"#;' \
         -e 's#"@types/react-dom": ".+?"#"@types/react-dom": "^17.0.5"#;' \
    ./packages/*/package.json

rm -rf node_modules && \
  rm -rf packages/circus-*/node_modules && \
  npm ci && \
  npx lerna bootstrap --hoist --ci && \
  npx lerna run build
```
