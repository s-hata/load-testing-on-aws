export const prj = {
  src: {
    dir: './pipeline',
    files: [ './pipeline/**/*.+(yml|yaml)' ]
  },
  dist: {
    dir: './dist',
    files: [ "dist/**/*", "!dist/package.json", "!dist/package-lock.json", "dist/.*" ]
  }
};
