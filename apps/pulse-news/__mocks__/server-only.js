// Mock for the "server-only" package.
// The real package throws an error when imported outside a React Server Component.
// In test environments we need to suppress this error since Jest runs in Node.
module.exports = {};
