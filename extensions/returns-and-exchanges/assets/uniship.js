setIframeSource()

window.addEventListener('message', (message) => {
  const fn = function (message) {
    if (message.data?.type === 'MAKE_CALL') handleAPICalls(message)
    if (message.data?.type === 'DIMENSIONS') handleDimensionsChange(message)
  }

  fn(message)
})

async function handleAPICalls(message) {
  const headers = new Headers()

  Object.keys(message.data?.headers).forEach((headerName) => {
    if (message.data.headers[headerName])
      headers.append(headerName, message.data.headers[headerName])
  })

  try {
    let response

    if (message.data?.key.includes('api/v1/rms/customer/upload-files')) {
      const formData = new FormData()

      const key1 = `fileUploadData[0].${message.data?.parameters.identifierKey}`
      const value1 = message.data?.parameters.identifier

      const key2 = 'fileUploadData[0].files[0]'
      const value2 = new File(
        [message.data?.parameters.file],
        message.data?.parameters.fileName
      )

      formData.append(key1, value1)
      formData.append(key2, value2)

      response = await fetch(message.data?.key, {
        method: message.data?.method,
        body: formData,
        headers,
      })
    } else if (message.data?.key.includes('api/v1/rms/customer/upload-media')) {
      const formData = new FormData()

      const file = new File(
        [message.data?.parameters.file],
        message.data?.parameters.fileName
      )

      formData.append('files', file, message.data?.parameters.fileName)

      response = await fetch(message.data?.key, {
        method: message.data?.method,
        body: formData,
        headers,
      })
    } else {
      response = await fetch(message.data?.key, {
        method: message.data?.method,
        body: message.data?.body,
        headers,
      })
    }

    const text = await response.text()
    const didErrorOccur = JSON.parse(text).hasOwnProperty('errorCode')

    top.document.querySelector('#returns').contentWindow.postMessage(
      {
        type: 'CALLBACK',
        text: response.ok ? text : '',
        status: response.status,
        'Rms-Buyer-Session': response.headers.get('Rms-Buyer-Session'),
        ok: didErrorOccur ? false : response.ok,
        statusText: response.statusText,
        key: message.data?.key,
      },
      '*'
    )
  } catch {
    top.document.querySelector('#returns').contentWindow.postMessage(
      {
        type: 'CALLBACK',
        text: '',
        status: 500,
        'Rms-Buyer-Session': '',
        ok: false,
        statusText: 'An unexpected error occurred',
        key: message.data?.key,
      },
      '*'
    )
  }
}

function handleDimensionsChange(message) {
  const iframe = document.getElementById('returns')

  const height = message.data?.parameters.height
  const currentHeight = iframe.clientHeight

  const width = message.data?.parameters.width
  const currentWidth = iframe.clientWidth

  if (iframe && height && currentHeight - height !== 5)
    iframe.style.height = `${height + 5}px`
  if (iframe && width && currentWidth !== width)
    iframe.style.width = `${width}px`
}

function setIframeSource() {
  const url = new URL(window.location.href)
  const searchParams = new URLSearchParams(url.search)
  const iframe = document.getElementById('returns')

  if (searchParams.has('order_id') && searchParams.has('identifier')) {
    const orderId = decodeURIComponent(searchParams.get('order_id'))
    const identifier = decodeURIComponent(searchParams.get('identifier'))
    iframe.setAttribute(
      'src',
      `https://onefriday-rms-unilog.unicommerce.com/search/?order_id=${encodeURIComponent(
        orderId
      )}&identifier=${encodeURIComponent(identifier)}`
    )
    // iframe.setAttribute(
    //   'src',
    //   `http://localhost:3001/search/?order_id=${encodeURIComponent(
    //     orderId
    //   )}&identifier=${encodeURIComponent(identifier)}`
    // )
  } else {
    iframe.setAttribute(
      'src',
      'https://onefriday-rms-unilog.unicommerce.com/'
    )
    // iframe.setAttribute('src', `http://localhost:3001/`)
  }
  iframe.classList.remove('hide')
}
