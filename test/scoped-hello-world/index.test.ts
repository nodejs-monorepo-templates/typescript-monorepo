import message from '@scope-name/scoped-hello-world'

it('message matches snapshot', () => {
  expect(message).toMatchSnapshot()
})
