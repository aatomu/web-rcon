import { connect } from 'cloudflare:sockets'

enum SendType {
	BadAuth = -1,
	Response = 0,
	ExecuteCommand = 2,
	AuthSuccess = 2,
	ServerAuth = 3,
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		const params = new URLSearchParams(url.searchParams)
		const ip = params.get('ip')
		const port = params.get('port')
		const pass = params.get('pass')
		const cmd = params.get('cmd')
		if (ip && port && pass && cmd) {
			try {
				const addr = { hostname: ip, port: Number(port) }
				const socket = connect(addr)
				const writer = socket.writable.getWriter()
				const reader = socket.readable.getReader()
				let uniqueID = 1

				// Login
				await writer.write(makePacket(SendType.ServerAuth, pass, uniqueID))
				uniqueID++
				let res = await reader.read()
				if (!res.value) {
					return new Response(null, { status: 500 })
				}
				const login = new Uint8Array(res.value)
				console.log(login, parsePacket(login))
				// Execute
				await writer.write(makePacket(SendType.ExecuteCommand, cmd, uniqueID))
				uniqueID++
				res = await reader.read()
				if (!res.value) {
					return new Response(null, { status: 500 })
				}
				const execute = new Uint8Array(res.value)
				const response = parsePacket(execute)
				console.log(response)
				return new Response(JSON.stringify(response), {
					headers: {
						'Content-Type': 'application/json',
					},
				})
			} catch (e) {
				return new Response(`Error:${e}`, { status: 500 })
			}
		}

		return new Response(null, { status: 400 })
	},
} satisfies ExportedHandler<Env>

function makePacket(sendType: SendType, body: string, id: number): Uint8Array {
	const bodyBytes = new TextEncoder().encode(body)
	// size = packetID(Uint32) + sendType(Uint32) + body(byte) + bodyEnd(1) + End(1)
	const size = 4 + 4 + bodyBytes.length + 1 + 1
	const packetID = id

	// buffer = sizeHeader(Uint32) + size
	const buffer = new ArrayBuffer(4 + size)
	const packet = new DataView(buffer)
	let index = 0
	packet.setUint32(index, size, true)
	index += 4
	packet.setUint32(index, packetID, true)
	index += 4
	packet.setUint32(index, sendType, true)
	index += 4
	for (let i = 0; i < bodyBytes.length; i++) {
		packet.setUint8(index, bodyBytes[i])
		index++
	}
	packet.setUint8(index, 0x00)
	index++
	packet.setUint8(index, 0x00)
	index++

	return new Uint8Array(buffer)
}

type Packet = {
	size: number
	id: number
	type: number
	body: string
}

function parsePacket(raw: Uint8Array): Packet {
	var packet: Packet = {
		size: 0,
		id: 0,
		type: 0,
		body: '',
	}
	const rawPacket = new DataView(raw.buffer)
	let index = 0
	let body = []

	packet.size = rawPacket.getInt32(index, true)
	index += 4
	packet.id = rawPacket.getInt32(index, true)
	index += 4
	packet.type = rawPacket.getInt32(index, true)
	index += 4
	while (index < rawPacket.byteLength - 2) {
		body.push(rawPacket.getInt8(index))
		index += 1
	}
	packet.body = new TextDecoder().decode(new Uint8Array(body).buffer)
	return packet
}
