import fn from 'khai-hello-world'

it('matches snapshot', () => {
  expect(fn()).toMatchSnapshot()
})
