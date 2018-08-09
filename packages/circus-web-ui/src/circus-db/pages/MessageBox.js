import React from 'react';
import { dismissMessage } from 'shared/actions';
import { connect } from 'react-redux';
import { Alert } from 'shared/components/react-bootstrap';

class MessageBoxView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: []
    };
  }

  render() {
    return (
      <div className="message-boxes">
        {this.props.messages.map(m => {
          const style = m.style ? m.style : 'success';
          return (
            <Alert
              key={m.id}
              bsStyle={style}
              onDismiss={() => dismissMessage(m.id)}
            >
              {m.message}
            </Alert>
          );
        })}
      </div>
    );
  }
}

const MessageBox = connect(state => ({ messages: state.messages }))(
  MessageBoxView
);

export default MessageBox;
