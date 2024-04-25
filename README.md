
# Description
A simple chat app with websockets, server-client
# Milestones
## prototype
- JS no libraries
- Security
	- [ ] sanitize HTML
	- [ ] xss
	- [ ] csrf
	- [ ] https production
- CICD
- Deploy to demo domain
  - http://expressjs.com/en/advanced/best-practice-performance.html#proxy
- ? Mobile design

## release 1.0
- Decide mobile vs desktop design
- Increment abstractions
  - Web Components https://developer.mozilla.org/en-US/docs/Web/Web_Components
      - lit https://lit.dev/
      - other web component library https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#libraries
  - Consider front end library: React | Solid
- Consider Typescript
- Tests as needed
- Improve debuggery
  - server logs
  - console object usage
  - lil-gui?
- Consider Socket.io or implement own
