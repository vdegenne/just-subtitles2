import { EditorView } from './editor-view';
import { sleep } from './util';
import gameControl from 'gamecontroller.js/src/gamecontrol.js'

export class ControllerController {
  private editor: EditorView;
  private controllerEventsLoopHandle
  private controllerEventsLoopBind = this.controllerEventsLoop.bind(this)
  private gamepad!: Gamepad
  private pressed: number[] = []

  private secondary =false
  private leftArrowPressed = false
  private rightArrowPressed = false

  /**
   * Constructor
   */
  constructor (appInstance: EditorView) {
    this.editor = appInstance;
    gameControl.on('connect', gamepad=>{
      gamepad
      .before('button0', ()=>{
        this.editor.togglePlay()
      })
      .before('button1', ()=>{
        if (!this.editor.videoElement.playing) {
          this.editor.togglePlay()
        }
        else {
          this.editor.videoElement.cancelPlayFroTo()
        }
      })
      // <-----
      .before('button14', ()=>{
        this.leftArrowPressed = true
        this.editor.videoElement.stepBack(this.secondary ? 0.1 : 1);
        setTimeout(async ()=>{
          while (this.leftArrowPressed) {
            this.editor.videoElement.stepBack(this.secondary ? 0.1 : 1);
            await sleep(100)
          }
        }, 1000)
      })
      .after('button14', ()=>{ this.leftArrowPressed = false })
      // ----->
      .before('button15', ()=>{
        this.rightArrowPressed = true
        this.editor.videoElement.stepForward(this.secondary ? 0.1 : 1);
        setTimeout(async ()=>{
          while (this.rightArrowPressed) {
            this.editor.videoElement.stepForward(this.secondary ? 0.1 : 1);
            await sleep(100)
          }
        }, 1000)
      })
      .after('button15', ()=>{ this.rightArrowPressed = false })

      .before('button3', () => {
        // if (!this.secondary) {
          this.editor.insertNewCue()
        // }
        if (this.secondary) {
          this.editor.clingStartTimeToPreviousCueEndTime()
        }
      })

      .before('button12', ()=>this.editor.previousCue())
      .before('button13', ()=>{
        if (this.secondary) {
          this.editor.lastCue();
        }
        else {
          this.editor.nextCue()
        }
      })
      .before('button7', ()=>{
        if (this.secondary) {
          this.editor.videoElement.stop()
          this.editor.clingVideoToStartTime()
          this.editor.togglePlay()
        }
        else {
          this.editor.playInterval(false)
        }
      })

      .before('button4', ()=>{
        if (this.secondary) {
          this.editor.videoElement.speedDown()
        }
        else {
          this.editor.clingVideoToStartTime()
        }
      })
      .before('button5', ()=>{
        if (this.secondary) {
          this.editor.videoElement.speedUp()
        }
        else {
          this.editor.clingVideoToEndTime()
        }
      })
      .before('button10', ()=>{
        if (this.secondary) {
          this.editor.clingStartTimeToPreviousCueEndTime()
        }
        else {
          this.editor.clingStartTimeToVideoCurrentTime()
        }
      })
      .before('button11', ()=>this.editor.clingEndTimeToVideoCurrentTime())

      .before('button6', ()=>this.secondary=true)
      .after('button6', ()=>this.secondary=false)


      .before('left0', ()=>this.editor.stretchStartTimeToLeft(!this.secondary ? 0.1 : 1))
      .before('right0', ()=>this.editor.stretchStartTimeToRight(!this.secondary ? 0.1 : 1))
      .before('left1', ()=>this.editor.stretchEndTimeToLeft(!this.secondary ? 0.1 : 1))
      .before('right1', ()=>this.editor.stretchEndTimeToRight(!this.secondary ? 0.1 : 1))
    })
    // window.addEventListener("gamepadconnected", (e) => {
    //   this.gamepad = e.gamepad
    //   this.controllerEventsLoop()
    // });
    // window.addEventListener("gamepaddisconnected", (e) => {
    //   this.disconnect()
    // })
  }

  disconnect() {
    // @ts-ignore
    this.gamepad = undefined
    cancelAnimationFrame(this.controllerEventsLoopHandle)
  }

  getButtonId (button: GamepadButton) {
    return this.gamepad.buttons.indexOf(button)
  }



  /**
   * Main loop
   */
  controllerEventsLoop () {
    const gp = this.gamepad = navigator.getGamepads()[0] as Gamepad;
    const pressed = gp.buttons.filter(b => b.pressed)
    const pressedIds = pressed.map(button => this.getButtonId(button))
    console.log(pressedIds);
    if (!arrayLinearEquals(pressedIds, this.pressed)) { // state changed
      this.pressed = pressedIds
      console.log(this.pressed)
    }
    // if (gp.buttons[3].pressed) {
    //   console.log(gp.buttons, this.gamepad.buttons)
    //   this.disconnect()
    // }
    this.controllerEventsLoopHandle = requestAnimationFrame(this.controllerEventsLoopBind);
  }

  before (buttonIndex: number) {
    switch (buttonIndex) {
      case 12:

        break
    }
  }
}