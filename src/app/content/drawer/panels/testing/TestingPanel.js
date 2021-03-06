import React from 'react';
import '../Panel.css';
import './TestingPanel.css';

import Viewport from 'content/viewport/Viewport.js';

import Downloader from 'util/Downloader.js';

import TestingManager from 'testing/TestingManager.js';
import TestingInput from './TestingInput.js';

const TEST_FILENAME = "test.txt";

class TestingPanel extends React.Component
{
  constructor(props)
  {
    super(props);

    this.container = React.createRef();
    this.uploadInput = React.createRef();

    this.state = {
      errorCheckMode: this.props.tester.getErrorCheckMode()
    };

    this.onChangeErrorCheckMode = this.onChangeErrorCheckMode.bind(this);
    this.onUploadFileChange = this.onUploadFileChange.bind(this);
    this.onGraphChange = this.onGraphChange.bind(this);
    this.onTestsRunAll = this.onTestsRunAll.bind(this);
    this.onTestsClear = this.onTestsClear.bind(this);
    this.onTestsSave = this.onTestsSave.bind(this);
  }

  componentWillMount()
  {
    const graphController = this.props.graphController;
    const graph = graphController.getGraph();

    //HACK: this should be a listener to FSABuilder, should not access graph
    graph.on("markDirty", this.onGraphChange);
  }

  componentWillUnmount()
  {
    const graphController = this.props.graphController;
    const graph = graphController.getGraph();

    graph.removeEventListener("markDirty", this.onGraphChange);
  }

  onGraphChange(g)
  {
    this.props.tester.inputList.resetTests();
  }

  onUploadFileChange(e)
  {
    const files = e.target.files;
    if (files.length > 0)
    {
      this.props.tester.inputList.importTests(files[0]);

      //Makes sure you can upload the same file again.
      e.target.value = "";
    }
  }

  onChangeErrorCheckMode(e)
  {
    const value = e.target.value;

    const graphController = this.props.graphController;
    const machineController = this.props.machineController;
    const tester = this.props.tester;

    const graph = graphController.getGraph();
    const machineBuilder = machineController.getMachineBuilder();
    tester.setErrorCheckMode(value);

    //HACK: this should automatically be updated by testing manager on set error check mode
    if (!tester.shouldCheckError)
    {
      machineBuilder.machineErrorChecker.clear();
    }
    else
    {
      machineBuilder.onGraphChange(graph);
    }

    this.setState({errorCheckMode: value});
  }

  onTestsRunAll(e)
  {
    const machine = this.props.machineController.getMachineBuilder().getMachine();
    const testList = this.props.tester.inputList;
    const length = testList.getTests().length;
    for(let i = 0; i < length; ++i)
    {
      testList.testByIndex(i, machine);
    }
  }

  onTestsClear(e)
  {
    this.props.tester.inputList.clearTests();
  }

  onTestsSave(e)
  {
    Downloader.downloadText(TEST_FILENAME, this.props.tester.inputList.getTestsAsStrings().join("\n"));
  }

  render()
  {
    const viewport = this.props.viewport;
    const machineBuilder = this.props.machineController.getMachineBuilder();
    const tester = this.props.tester;
    const testList = tester.inputList;

    const isTestInvalid = !machineBuilder.isValidMachine();

    return <div className="panel-container" id="testing" ref={ref=>this.container=ref}>
      <div className="panel-title">
        <h1>{I18N.toString("component.testing.title")}</h1>
      </div>

      <div className="panel-content">

        <div className="test-inputlist-container">
          <button className="panel-button" onClick={this.onTestsRunAll}>
            {I18N.toString("action.testing.runall")}
          </button>

          <div className="scrollbar-container">
            <div className="test-inputlist-content">
              {
                isTestInvalid &&
                <label className="test-inputlist-content-warning">Not a valid machine!</label>
              }
              {
                testList.getTests().map((e, i) =>
                  <TestingInput key={e.id} index={i}
                    testList={testList}
                    machineBuilder={machineBuilder}/>)
              }

              <button className="panel-button" onClick={this.onTestsClear}>
                {I18N.toString("action.testing.clear")}
              </button>
            </div>
          </div>

          <button className="panel-button" id="test-upload"
            onClick={() => this.uploadInput.click()}>
            <input ref={ref=>this.uploadInput=ref}
              id="test-upload-input" type="file" name="import"
              style={{display: "none"}}
              onChange={this.onUploadFileChange} accept=".txt"/>
            {I18N.toString("action.testing.import")}
          </button>

          <button className="panel-button" id="test-save"
            onClick={this.onTestsSave}
            disabled={this.props.tester.inputList.isEmpty()}>
            {I18N.toString("action.testing.save")}
          </button>
        </div>

        <hr />

        <div id="test-errorcheck">
          <label>{I18N.toString("options.checkerrors")}</label>
          <select className="panel-select"
            value={this.state.errorCheckMode}
            onChange={this.onChangeErrorCheckMode}>
            <option value={TestingManager.NO_ERROR_CHECK}>{I18N.toString("options.checkerrors.mode.none")}</option>
            <option value={TestingManager.DELAYED_ERROR_CHECK}>{I18N.toString("options.checkerrors.mode.delayed")}</option>
            <option value={TestingManager.IMMEDIATE_ERROR_CHECK}>{I18N.toString("options.checkerrors.mode.immediate")}</option>
          </select>
        </div>
        <div className="panel-checkbox">
          <input id="test-step" type="checkbox"
            checked={tester.getStepByStepMode()}
            onChange={(e) => {
              tester.setStepByStepMode(e.target.checked);
            }}/>
          <label htmlFor="test-step">{I18N.toString("options.testing.stepmode")}</label>
        </div>
      </div>

      <div className="panel-bottom"></div>
    </div>;
  }
}

export default TestingPanel;
