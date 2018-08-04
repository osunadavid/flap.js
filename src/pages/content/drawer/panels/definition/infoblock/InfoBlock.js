import React from 'react';

import CollapseIcon from './CollapseIcon.js';

import './InfoBlock.css';

class InfoBlock extends React.Component
{
  constructor(props)
  {
    super(props);

    this.state = {
      isCollapsed: false
    };

    this.onCollapse = this.onCollapse.bind(this);
  }

  onCollapse(e)
  {
    this.setState((prev, props) => {
      return {isCollapsed: !prev.isCollapsed};
    });
  }

  render()
  {
    const collapsed = this.state.isCollapsed;
    return <div className="infoblock-container">
      <div className="infoblock-header">
        <label>{this.props.title}</label>
        <CollapseIcon more={collapsed} onClick={this.onCollapse}/>
      </div>
      <div className="infoblock-content" style={{
        display: collapsed ? "none" : "block"
      }}>
        {this.props.children}
      </div>
    </div>;
  }
}

export default InfoBlock;