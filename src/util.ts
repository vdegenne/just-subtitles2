
export function arrayLinearEquals (a1: Array<any>, a2: Array<any>): boolean {
  let i = 0
  for (; i < a1.length; i++) {
    if (a1[i] !== a2[i]) {
      return false
    }
  }
  return true
}



export function sleep (sleepMs: number) {
  return new Promise((resolve, reject) => { setTimeout(resolve, sleepMs) })
}