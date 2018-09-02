import fn from 'test-monorepo-hello-world'

it('matches snapshot', () => {
  expect(fn()).toMatchSnapshot()
})
