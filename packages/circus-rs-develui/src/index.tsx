import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { dispatch, store } from './store';
import { Provider } from 'react-redux';

import App from './components/App';
import { loadConfiguration } from 'store/configuration';
import { setRsServer } from 'store/volume';

const TheApp: React.FC<{}> = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

async function main() {
  await dispatch(loadConfiguration());
  const { server } = store.getState().configuration;
  await dispatch(setRsServer({ server }));

  ReactDOM.render(<TheApp />, document.getElementById('app'));
}
main();