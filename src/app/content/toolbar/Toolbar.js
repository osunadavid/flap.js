import React from 'react';
import './Toolbar.css';

import Config from 'config.js';

import UploadButton from "./UploadButton.js";
import HelpButton from "./HelpButton.js";
import MachineName from './MachineName.js';

import IconButton from 'icons/IconButton.js';

import MoreIcon from 'icons/MoreIcon.js';
import UploadIcon from 'icons/UploadIcon.js';
import CreateIcon from 'icons/PageNewIcon.js';
//import CreateIcon from 'icons/CreateIcon.js';
import SaveIcon from 'icons/SaveIcon.js';
//import SaveIcon from 'icons/DiskSaveIcon.js';
import UndoIcon from 'icons/UndoIcon.js';
import RedoIcon from 'icons/RedoIcon.js';
import HelpIcon from 'icons/HelpIcon.js';
import LanguageIcon from 'icons/LanguageIcon.js';
import OfflineIcon from 'icons/OfflineIcon.js';
import OfflinePinIcon from 'icons/OfflinePinIcon.js';

class Toolbar extends React.Component
{
  constructor(props)
  {
    super(props);

    this.state = {
      langOn: false
    };

    this.onMachineNameChange = this.onMachineNameChange.bind(this);
    this.onMachineNameKeyDown = this.onMachineNameKeyDown.bind(this);
    this.langOnClick = this.langOnClick.bind(this);
  }

  onMachineNameChange(e)
  {
    this.props.machineController.renameMachine(e.value);
  }

  onMachineNameKeyDown()
  {

  }

  onMachineNameBlur()
  {

  }

  langOnClick()
  {
    this.setState({langOn: !this.state.langOn});
  }

  render()
  {
    const graphController = this.props.graphController;
    const machineController = this.props.machineController;
    const eventManager = this.props.eventManager;
    const notification = this.props.notification;
    const drawer = this.props.drawer;

    const graph = graphController.getGraph();
    const machineBuilder = machineController.getMachineBuilder();
    const events = eventManager.getLogger();

    const offline = navigator && navigator.onLine;

    return <div className="toolbar-container">
      <div className="toolbar-title">
        <div className="toolbar-title-name">
          {/*Machine Name*/}
          <MachineName id="machine-name" value={machineController.getMachineName()} onSubmit={this.onMachineNameChange}/>
          {/*Toolbar Alt. Title*/}
          <div className="toolbar-title-alt">
            {/*Offline Button*/}
            <IconButton id="toolbar-lang" title={I18N.toString("action.toolbar.lang")}
              onClick={() => {
                if ('serviceWorker' in navigator)
                {
                  if (navigator.serviceWorker.getRegistration("./app.html"))
                  {
                    alert(I18N.toString("message.offline.ready"));
                  }
                  else
                  {
                    alert(I18N.toString("message.offline.failed"));
                  }
                }
                else
                {
                  alert(I18N.toString("message.offline.nosupport"));
                }
              }} disabled={offline}>
              <OfflineIcon/>
            </IconButton>
            {/*Upload Button
            <div id="toolbar-upload-alt"
              title={I18N.toString("action.toolbar.uploadmachine")}>
              <MoreIcon/>
            </div>
            */}
          </div>
        </div>
        {/*Machine Type*/}
        <label id="machine-type"
          onClick={()=>drawer.setTab(1)}>
          {machineBuilder.getMachineType()}
        </label>
      </div>

      <div className="toolbar-tray">
        {/*New Button*/}
        <IconButton className="navicon" id="toolbar-new" title={I18N.toString("action.toolbar.newmachine")}
          onClick={() => {
            if (window.confirm(I18N.toString("alert.graph.clear")))
            {
              graph.deleteAll();
              events.clear();
              machineController.setMachineName(null);
            }
          }}>
          <CreateIcon/>
        </IconButton>
        {/*Upload Button*/}
        <UploadButton className="navicon" id="toolbar-upload" title={I18N.toString("action.toolbar.uploadmachine")}
          graphController={graphController}>
          <UploadIcon/>
        </UploadButton>
        {/*Undo Button*/}
        <IconButton className="navicon" id="toolbar-undo" title={I18N.toString("action.toolbar.undo")}
          disabled={!events.canUndo()}
          onClick={()=>events.undo()}>
          <UndoIcon/>
        </IconButton>
        {/*Redo Button*/}
        <IconButton className="navicon" id="toolbar-redo" title={I18N.toString("action.toolbar.redo")}
          disabled={!events.canRedo()}
          onClick={()=>events.redo()}>
          <RedoIcon/>
        </IconButton>
        {/*Save Button*/}
        <IconButton className="navicon" id="toolbar-save" title={I18N.toString("action.toolbar.save")}
          onClick={()=>drawer.setTab(2)} disabled={graph.isEmpty()}>
          <SaveIcon/>
        </IconButton>

        {/*Right Alt. Toolbar*/}
        <div className="toolbar-tray-alt">
          {/*Help Button*/}
          <HelpButton className="navicon" id="toolbar-help" title={I18N.toString("action.toolbar.help")}
            notification={notification}>
            <HelpIcon/>
          </HelpButton>
          {/*Language Button*/}
          <IconButton className="navicon" id="toolbar-lang" title={I18N.toString("action.toolbar.lang")}
            onClick={(e) => {document.activeElement.blur(); this.langOnClick();}} >
            <LanguageIcon/>
          </IconButton>
          {/*Language Select*/}
          <select id="toolbar-lang-select" style={{maxWidth: (this.state.langOn ? "10em" : "0")}} onChange={(e) => {I18N.fetchLanguageFile(e.target.value);}}>
            <option value="en_us">English</option>
            <option value="xx_pirate">Pirate Speak</option>
          </select>
        </div>
      </div>
    </div>;
  }
}

export default Toolbar;
