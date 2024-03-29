// pick two random elements from array
export const pick = (arr, n) => {
  const result = []
  const len = arr.length
  const taken = []

  if (n > len) {
    return
  }

  while (result.length < n) {
    const x = Math.floor(Math.random() * len)

    if (!taken.includes(x)) {
      taken.push(x)
      result.push(arr[x])
    }
  }

  return result
}