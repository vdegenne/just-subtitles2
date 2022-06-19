
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


export async function createDirectory (path: string, name: string) {
  const response = await fetch('/api/create-directory', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ path, name })
  })
  if (response.status != 200) {
    throw new Error('Couldn\'t create directory')
  }
}


export async function createProject (path: string, name: string, youtube: string) {
  const response = await fetch('/api/create-project', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ path, name, youtube })
  })
  if (response.status != 200) {
    throw new Error('Couldn\'t create project')
  }
}