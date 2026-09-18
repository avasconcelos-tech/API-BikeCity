# BikeCity — acesso por vários computadores na mesma rede

## 1. No computador que vai hospedar o sistema

Abra o PowerShell ou CMD dentro desta pasta e execute:

```bash
npm install
npm start
```

O servidor escuta em `0.0.0.0:3000`, permitindo acesso por outros computadores da rede local.

Ao iniciar, o terminal mostra um ou mais endereços como:

```text
Acesso pela rede local:
  http://192.168.1.15:3000/login.html
```

Use o endereço IPv4 mostrado no terminal.

## 2. Nos computadores dos colegas

Eles devem estar na mesma rede Wi-Fi/LAN do computador que está executando o servidor.

No navegador, acesse o endereço mostrado no terminal, por exemplo:

```text
http://192.168.1.15:3000/login.html
```

**Não use `localhost` ou `127.0.0.1` no computador do colega**, pois esses endereços apontam para a própria máquina dele.

## 3. Não é necessário usar Live Server

O próprio Node entrega os arquivos do front-end na porta 3000.

Portanto, prefira:

```text
http://IP-DO-COMPUTADOR-HOST:3000/login.html
```

Se alguém abrir acidentalmente pelo Live Server na porta 5500, o front-end foi preparado para tentar enviar as chamadas da API para a porta 3000 da mesma máquina. Mesmo assim, para a apresentação, use diretamente a porta 3000.

## 4. Se aparecer `ERR_CONNECTION_TIMED_OUT`

No computador que hospeda o sistema, execute como administrador:

```text
liberar-porta-3000-firewall.bat
```

Depois confirme que a rede do Windows está como **Privada** quando apropriado e reinicie `npm start`.

## 5. Teste rápido

No computador do colega, abra:

```text
http://IP-DO-COMPUTADOR-HOST:3000/
```

Deve aparecer:

```json
{"mensagem":"API BikeCity rodando com sucesso! 🚀"}
```

Depois abra `/login.html`.
