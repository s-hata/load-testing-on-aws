export const prj = {
  src: {
    dir: './pipeline',
    files: [ './pipeline/**/*.+(yml|yaml)' ]
  },
  dist: {
    dir: './dist',
    files: [ "dist/**/*", "!dist/package.json", "!dist/package-lock.json", "dist/.*" ]
  },
  config: {
    aws: {
      region: "us-east-1",
      profile: "default",
      stackName: "load-testing",
      bucketRegion: "us-east-1",
      bucketName: "showcase-template-store",
    }
  }
};
