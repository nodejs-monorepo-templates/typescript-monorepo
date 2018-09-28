import fn from 'hello-world'

it('matches snapshot', () => {
  expect(fn()).toMatchSnapshot()
})
