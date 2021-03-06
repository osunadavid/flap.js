import Config from 'config.js';

import Eventable from 'util/Eventable.js';

import GraphPointer from './GraphPointer.js';

const PINCH_SENSITIVITY = 1 / 300.0;

class InputController
{
  constructor(graph)
  {
    this.workspace = null;

    this._pointer = new GraphPointer(graph);

    this._cursor = {
      _mousemove: null,
      _mouseup: null,
      _touchmove: null,
      _touchend: null,
      _timer: null
    };

    //Swap left to right clicks and vice versa on anything else but Macs
    this._swapMouseScheme = true;//!navigator.platform.startsWith("Mac");

    this.prevPinchDist = 0;
    this.pinchDist = 0;

    //inputdown(input, x, y, target, targetType, event) - Called when input is starting touch/press/click
    //event.result can be changed to decide whether to continue to process future related events
    //by default, it is true
    this.registerEvent("inputdown");
    //inputmove(input, x, y, target, targetType) - Called when input moves
    this.registerEvent("inputmove");
    //inputup(input, x, y, target, targetType) - Called when input is released
    this.registerEvent("inputup");
    //inputaction(input, x, y, target, targetType) - Called when input is completed
    this.registerEvent("inputaction");
    //dragstart(input, x, y, target, targetType) - Called when a drag begins
    this.registerEvent("dragstart");
    //dragmove(input, x, y, target, targetType) - Called when a drag moves
    this.registerEvent("dragmove");
    //dragstop(input, x, y, target, targetType) - Called when a drag finishes
    this.registerEvent("dragstop");

    this.onContextMenu = this.onContextMenu.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }

  initialize(app)
  {
    //Prepare the workspace
    this.workspace = app.workspace.ref;

    //Process mouse handlers
    this.workspace.addEventListener('mousedown', this.onMouseDown);
    this.workspace.addEventListener('mousemove', this.onMouseMove);
    this.workspace.addEventListener('contextmenu', this.onContextMenu);
    this.workspace.addEventListener('wheel', this.onWheel);

    //Process touch handlers
    this.workspace.addEventListener('touchstart', this.onTouchStart);
    this.workspace.addEventListener('touchmove', this.onTouchMove);
  }

  destroy()
  {
    //Process mouse handlers
    this.workspace.removeEventListener('mousedown', this.onMouseDown);
    this.workspace.removeEventListener('mousemove', this.onMouseMove);
    this.workspace.removeEventListener('contextmenu', this.onContextMenu);
    this.workspace.removeEventListener('wheel', this.onWheel);

    //Process touch handlers
    this.workspace.removeEventListener('touchstart', this.onTouchStart);
    this.workspace.removeEventListener('touchmove', this.onTouchMove);
  }

  update()
  {
    //Smooth transition offset
    this._pointer.updateOffset();
  }

  setTrashMode(enabled)
  {
    this._pointer.trashMode = enabled;
  }

  setInputScheme(shouldActionFirst)
  {
    this._swapMouseScheme = !shouldActionFirst;
  }

  getInputScheme()
  {
    return this._swapMouseScheme;
  }

  getPointer()
  {
    return this._pointer;
  }

  isUsingTouch()
  {
    return this._cursor._touchmove || this._cursor._touchend;
  }

  /*************************************************************************
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * INPUT HANDLERS
   * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   *************************************************************************/

  onContextMenu(e)
  {
    e.stopPropagation();
    e.preventDefault();

    return false;
  }

  onWheel(e)
  {
    e.stopPropagation();
    e.preventDefault();

    const pointer = this._pointer;

    this.pinchDist = e.deltaY * Config.SCROLL_SENSITIVITY;
    pointer.setScale(pointer.scale + this.pinchDist);
  }

  onTouchMove(e)
  {
    const pointer = this._pointer;
    const mouse = getMousePosition(this.workspace, e.touches[0]);
    pointer.setPosition(mouse.x, mouse.y);
  }

  onTouchStart(e)
  {
    if (e.changedTouches.length == 2)
    {
    /*
      e.stopPropagation();
      e.preventDefault();

      document.activeElement.blur();
      this.workspace.focus();

      if (this._cursor._touchmove)
      {
        document.removeEventListener('touchmove', this._cursor._touchmove);
        this._cursor._touchmove = null;
      }
      if (this._cursor._touchend)
      {
        document.removeEventListener('touchend', this._cursor._touchend);
        this._cursor._touchend = null;
      }

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.prevPinchDist = Math.hypot(
        touch1.pageX - touch2.pageX,
        touch1.pageY - touch2.pageY);

      this._cursor._touchmove = this.onPinchMove.bind(this);
      this._cursor._touchend = this.onPinchEnd.bind(this);

      document.addEventListener('touchmove', this._cursor._touchmove);
      document.addEventListener('touchend', this._cursor._touchend);
      */

      return false;
    }

    if (e.touches.length == 1)
    {
      e.stopPropagation();
      e.preventDefault();

      document.activeElement.blur();
      this.workspace.focus();

      const touch = e.changedTouches[0];

      if (this._cursor._touchmove)
      {
        document.removeEventListener('touchmove', this._cursor._touchmove);
        this._cursor._touchmove = null;
      }
      if (this._cursor._touchend)
      {
        document.removeEventListener('touchend', this._cursor._touchend);
        this._cursor._touchend = null;
      }

      let moveMode = false;
      moveMode = this._swapMouseScheme ? !moveMode : moveMode;
      if (this.doInputDown(touch.clientX, touch.clientY, moveMode/* false */))//default false
      {
        this._cursor._touchmove = this.onTouchStartAndMove.bind(this);
        this._cursor._touchend = this.onTouchStartAndEnd.bind(this);

        document.addEventListener('touchmove', this._cursor._touchmove);
        document.addEventListener('touchend', this._cursor._touchend);
      }
    }
    else
    {
      //Do nothin.
    }
  }

  onPinchMove(e)
  {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    this.pinchDist = Math.hypot(
      touch1.pageX - touch2.pageX,
      touch1.pageY - touch2.pageY);

    this._pointer.setScale(this.pinchDist * PINCH_SENSITIVITY);

    return false;
  }

  onPinchEnd()
  {
    if (this._cursor._touchmove)
    {
      document.removeEventListener('touchmove', this._cursor._touchmove);
      this._cursor._touchmove = null;
    }
    if (this._cursor._touchend)
    {
      document.removeEventListener('touchend', this._cursor._touchend);
      this._cursor._touchend = null;
    }

    return false;
  }

  onTouchStartAndEnd(e)
  {
    const touch = e.changedTouches[0];

    if (this._cursor._touchmove)
    {
      document.removeEventListener('touchmove', this._cursor._touchmove);
      this._cursor._touchmove = null;
    }
    if (this._cursor._touchend)
    {
      document.removeEventListener('touchend', this._cursor._touchend);
      this._cursor._touchend = null;
    }

    this.doInputDownAndUp(touch.clientX, touch.clientY);

    return false;
  }

  onTouchStartAndMove(e)
  {
    const touch = e.changedTouches[0];
    this.doInputDownAndMove(touch.clientX, touch.clientY);

    return false;
  }

  onMouseMove(e)
  {
    const pointer = this._pointer;
    const mouse = getMousePosition(this.workspace, e.clientX, e.clientY);
    pointer.setPosition(mouse.x, mouse.y);

    //Update target
    pointer.updateTarget();
    if (pointer.target != null)
    {
      document.body.style.cursor = "pointer";
    }
    else
    {
      document.body.style.cursor = "auto";
    }
  }

  onMouseDown(e)
  {
    e.stopPropagation();
    e.preventDefault();

    document.activeElement.blur();
    this.workspace.focus();

    if (this._cursor._mousemove)
    {
      document.removeEventListener('mousemove', this._cursor._mousemove);
      this._cursor._mousemove = null;
    }
    if (this._cursor._mouseup)
    {
      document.removeEventListener('mouseup', this._cursor._mouseup);
      this._cursor._mouseup = null;
    }

    let moveMode = (e.button == 2) || e.ctrlKey;
    moveMode = this._swapMouseScheme ? !moveMode : moveMode;
    if (this.doInputDown(e.clientX, e.clientY, moveMode))
    {
      this._cursor._mousemove = this.onMouseDownAndMove.bind(this);
      this._cursor._mouseup = this.onMouseDownAndUp.bind(this);

      document.addEventListener('mousemove', this._cursor._mousemove);
      document.addEventListener('mouseup', this._cursor._mouseup);
    }
  }

  onMouseDownAndMove(e)
  {
    e.stopPropagation();
    e.preventDefault();

    this.doInputDownAndMove(e.clientX, e.clientY);

    return false;
  }

  onMouseDownAndUp(e)
  {
    e.stopPropagation();
    e.preventDefault();

    if (this._cursor._mousemove)
    {
      document.removeEventListener('mousemove', this._cursor._mousemove);
      this._cursor._mousemove = null;
    }
    if (this._cursor._mouseup)
    {
      document.removeEventListener('mouseup', this._cursor._mouseup);
      this._cursor._mouseup = null;
    }

    this.doInputDownAndUp(e.clientX, e.clientY);

    return false;
  }

  doInputDown(x, y, moveMode)
  {
    const pointer = this._pointer;
    const mouse = getMousePosition(this.workspace, x, y);
    pointer.moveMode = moveMode;//If right click
    pointer.setInitialPosition(mouse.x, mouse.y);

    //Check whether to accept the start of input...
    const event = {result: true};
    this.emit("inputdown", this, pointer.x, pointer.y,
        pointer.initial.target, pointer.initial.targetType, event);

    this._cursor._timer = setTimeout(() => {
      if (pointer.isWaitingForMoveMode())
      {
        pointer.moveMode = this._swapMouseScheme ? false : true;//default true
      }
    }, Config.LONG_TAP_TICKS);

    return event.result;
  }

  doInputDownAndMove(x, y)
  {
    const pointer = this._pointer;
    const mouse = getMousePosition(this.workspace, x, y);
    pointer.setPosition(mouse.x, mouse.y);

    if (!pointer.dragging)
    {
      if (pointer.getDistanceSquToInitial() > pointer.getDraggingRadiusForTarget())
      {
        //Start drag!
        pointer.dragging = true;
        this.emit("dragstart", this, pointer.x, pointer.y,
            pointer.initial.target, pointer.initial.targetType);
      }
      else
      {
        //Still a click or hold
        pointer.dragging = false;
      }
    }
    else
    {
      //Continue to drag...
      this.emit("dragmove", this, pointer.x, pointer.y,
          pointer.initial.target, pointer.initial.targetType);
    }

    this.emit("inputmove", this, pointer.x, pointer.y,
        pointer.initial.target, pointer.initial.targetType);
  }

  doInputDownAndUp(x, y)
  {
    if (this._cursor._timer)
    {
      clearTimeout(this._cursor._timer);
      this._cursor._timer = null;
    }

    const pointer = this._pointer;
    pointer.updateTarget();

    if (pointer.dragging)
    {
      //Stop drag!
      this.emit("dragstop", this, pointer.x, pointer.y,
          pointer.initial.target, pointer.initial.targetType);
    }
    else
    {
      //Tap!
      this.emit("inputaction", this, pointer.x, pointer.y,
          pointer.initial.target, pointer.initial.targetType);
    }

    this.emit("inputup", this, pointer.x, pointer.y,
        pointer.initial.target, pointer.initial.targetType);

    //Set target as nothing since no longer interacting
    pointer.target = null;
    pointer.targetType = "none";
  }
}
//Mixin Eventable
Eventable.mixin(InputController);

function getMousePosition(svg, x, y)
{
  const ctm = svg.getScreenCTM();
  return {
    x: (x - ctm.e) / ctm.a,
    y: (y - ctm.f) / ctm.d
  };
}

export default InputController;
