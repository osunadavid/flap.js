import React from 'react';

class HelpButton extends React.Component
{
  constructor(props)
  {
    super(props);

    this.onClick = this.onClick.bind(this);
  }

  onClick(e)
  {
    const notification = this.props.notification;
    if (notification.hasMessages())
    {
      notification.addMessage("message.help.3");
      notification.addMessage("message.help.1");
    }
    else
    {
      notification.addMessage("message.help.2");
    }

    //The tutorial
    const LINK = "https://github.com/flapjs/FLAPJS-WebApp/blob/master/HELP.md";
    const newTab = window.open(LINK, '_blank');

    if (this.props.onClick)
    {
      this.props.onClick(e);
    }
  }

  render()
  {
    return <button
      className={"icon-button button-help " + this.props.className}
      id={this.props.id}
      title={this.props.title}
      style={this.props.style}
      disabled={this.props.disabled}
      onClick={this.onClick}>
      {this.props.children}
    </button>;
  }
}

export default HelpButton;
