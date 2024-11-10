# web-rcon
Rcon request by browser

Search Params:
 - `ip`: Rcon Server IP
 - `port`: Rcon Server Port
 - `tunnel`: Cloudflare Tunnel URI *Do not use prefix(`https://`)
 - `pass`: Rcon Password
 - `cmd`: Execute Command

Example:
 - Access by IPaddr \
	`https://rcon.aatomu.workers.dev/?ip=***&port=25567&pass=0000&cmd=say hello world!`
 - Access by Cloudflare Tunnel \
 	`https://rcon.aatomu.workers.dev/?tunnel=example.trycloudflare.com&pass=0000&cmd=say hello world!`


Minecraft Server内でRcon通知をOffにする
`broadcast-rcon-to-ops=false`
