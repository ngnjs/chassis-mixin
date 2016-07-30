'use strict'

require('localenvironment')
const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const header = require('gulp-header')
const sourcemaps = require('gulp-sourcemaps')
const ShortBus = require('shortbus')
const cp = require('child_process')
const del = require('del')
const MustHave = require('musthave')
const mh = new MustHave({
  throwOnError: false
})
const GithubPublisher = require('publish-release')
const fs = require('fs')
const path = require('path')
const pkg = require('./package.json')
let headerComment = '/**\n  * v' + pkg.version + ' generated on: '
  + (new Date()) + '\n  * Copyright (c) 2014-' + (new Date()).getFullYear()
  + ', Ecor Ventures LLC. All Rights Reserved. See LICENSE (BSD).\n  */\n'

const DIR = {
  source: path.resolve('./src'),
  dist: path.resolve('./dist')
}

// Build a release
gulp.task('build', ['clean', 'generate'])

// Check versions for Bower & npm
// gulp.task('version', function (next) {
//   console.log('Checking versions.')
//
//   // Sync Bower
//   let bower = require('./bower.json')
//   if (bower.version !== pkg.version) {
//     console.log('Updating bower package.')
//     bower.version = pkg.version
//     fs.writeFileSync(path.resolve('./bower.json'), JSON.stringify(bower, null, 2))
//   }
// })

// Create a clean build
gulp.task('clean', function (next) {
  console.log('Cleaning distribution.')
  try {
    fs.accessSync(DIR.dist, fs.F_OK)
    del.sync(DIR.dist)
  } catch (e) {}
  fs.mkdirSync(DIR.dist)
  next()
})

const minifyConfig = {
  presets: ['es2015'],
  mangle: true,
  compress: {
    dead_code: true,
    global_defs: {
      DEBUG: false
    },
    warnings: true,
    drop_debugger: true,
    unused: true,
    if_return: true,
    passes: 3
  }
}

const babelConfig = {
  presets: ['es2015']
}

const expand = function (array) {
  return array.map(function (file) {
    return path.join(DIR.source, file)
  })
}

const walk = function (dir) {
  let files = []
  fs.readdirSync(dir).forEach(function (filepath) {
    filepath = path.join(dir, filepath)
    const stat = fs.statSync(filepath)
    if (stat.isDirectory()) {
      files = files.concat(walk(filepath))
    } else {
      files.push(filepath)
    }
  })
  return files
}

require('colors')
gulp.task('generate', function (next) {
  const tasks = new ShortBus()
  const mapRoot = 'https://ngnjs.github.io/cdn/assets/chassis-mixins/sourcemaps/' + pkg.version
  const srcmapcfg = {
    includeContent: true,
    sourceMappingURL: function (file) {
      return mapRoot + '/' + file.relative + '.map'
    },
    sourceURL: function (file) {
      return file.relative.replace('.min.js', '.js')
    }
  }

  var files = fs.readdirSync(DIR.source).filter(function (filename) {
    return filename !== 'core.js'
  })

  files.unshift('core.js')

  console.log('Generating distribution files in ', DIR.dist)
  console.log('chassis.mixins.min.js\n'.cyan.bold, files.slim)

  // Minify common files
  files.forEach(function (filename) {
    tasks.add(function (cont) {
      console.log('Generating component file:', filename)
      gulp.src(path.join(DIR.source, filename))
        .pipe(sourcemaps.init())
        .pipe(concat(filename.replace('.js', '.min.js')))
        .pipe(babel(babelConfig))
        .pipe(uglify(minifyConfig))
        .pipe(header(headerComment))
        .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
        .pipe(gulp.dest(DIR.dist))
        .on('end', cont)
    })
  })

  tasks.add(function (cont) {
    console.log('Generating comprehensive file: chassis.mixins.min.js')
    var filepaths = files.map(function (filename) {
      return path.join(DIR.source, filename)
    })
    gulp.src(filepaths)
      .pipe(sourcemaps.init())
      .pipe(concat('chassis.mixins.min.js'))
      .pipe(babel(babelConfig))
      .pipe(uglify(minifyConfig))
      .pipe(header(headerComment))
      .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
      .pipe(gulp.dest(DIR.dist))
      .on('end', cont)
  })

  tasks.add(function (cont) {
    console.log('Generating comprehensive file: chassis.mixins.min.js')
    var filepaths = files.map(function (filename) {
      return path.join(DIR.source, filename)
    })
    gulp.src(filepaths)
      // .pipe(sourcemaps.init())
      .pipe(concat('chassis.mixins.debug.js'))
      .pipe(babel(babelConfig))
      // .pipe(uglify(minifyConfig))
      .pipe(header(headerComment))
      // .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
      .pipe(gulp.dest(DIR.dist))
      .on('end', cont)
  })

  tasks.on('complete', function () {
    // Zip the sourcemaps into a single archive
    const maps = fs.readdirSync(path.join(DIR.dist, 'sourcemaps'))
    if (maps.length > 0) {
      console.log('\nCreating sourcemap archive...')
      var gzip = require('gulp-vinyl-zip')
      return gulp.src(path.join(DIR.dist, 'sourcemaps', '/**/*'))
        .pipe(gzip.dest(path.join(DIR.dist, 'sourcemaps.zip')))
        .on('end', function () {
          setTimeout(function () {
            console.log('Done archiving sourcemaps.')
          }, 2000)
        })
      // gulp.src(path.join(DIR.dist, 'sourcemaps', '/*'))
      //   .pipe(Zip('sourcemaps.zip', {compress: true}))
      //   .pipe(gulp.dest(DIR.dist))
      //   .on('end', function () {
      //     setTimeout(function () {
      //       del.sync(path.join(DIR.dist, 'sourcemaps'))
      //     }, 10000)
      //   })
    }
  })

  tasks.process(true)
})

// gulp.task('prereleasecheck', function (next) {
//   console.log('Checking if package already exists.')
//   const child = cp.spawn('npm', ['info', pkg.name])
//
//   let data = ""
//   child.stdout.on('data', function (chunk) {
//     data += chunk.toString()
//   })
//   child.on('close', function () {
//     const re = new RegExp('latest: \'' + pkg.version + '\'')
//     if (re.exec(data) === null) {
//       next()
//     } else {
//       console.log('The version has not changed (' + pkg.version + '). A new release is unnecessary. Aborting deployment with success code.')
//       process.exit(0)
//     }
//   })
// })

gulp.task('release', function (next) {
  console.log('Checking if package already exists.')
  const child = cp.spawn('npm', ['info', pkg.name])

  let data = ""

  child.stdout.on('data', function (chunk) {
    data += chunk.toString()
  })

  child.on('close', function () {
    const re = new RegExp('latest: \'' + pkg.version + '\'')
    if (re.exec(data) === null) {
      if (!mh.hasAll(process.env, 'GITHUB_TOKEN', 'GITHUB_ACCOUNT', 'GITHUB_REPO')) {
        throw new Error('Release not possible. Missing data: ' + mh.missing.join(', '))
      }

      // Check if the release already exists.
      const https = require('https')

      https.get({
        hostname: 'api.github.com',
        path: '/repos/' + process.env.GITHUB_ACCOUNT + '/' + process.env.GITHUB_REPO + '/releases',
        headers: {
          'user-agent': 'Release Checker'
        }
      }, function (res) {
        let data = ""
        res.on('data', function (chunk) {
          data += chunk
        })

        res.on('error', function (err) {
          throw err
        })

        res.on('end', function () {
          data = JSON.parse(data).filter(function (release) {
            return release.tag_name === pkg.version
          })

          if (data.length > 0) {
            console.log('Release ' + pkg.version + ' already exists. Aborting without error.')
            process.exit(0)
          }

          const assets = walk(DIR.dist).sort()

          GithubPublisher({
            token: process.env.GITHUB_TOKEN,
            owner: process.env.GITHUB_ACCOUNT,
            repo: process.env.GITHUB_REPO,
            tag: pkg.version,
            name: pkg.version,
            notes: 'Releasing v' + pkg.version,
            draft: false,
            prerelease: false,
            reuseRelease: true,
            reuseDraftOnly: true,
            assets: assets,
            // apiUrl: 'https://myGHEserver/api/v3',
            target_commitish: 'master'
          }, function (err, release) {
            if (err) {
              err.errors.forEach(function (e) {
                console.error((e.resource + ' ' + e.code).red.bold)
              })
              process.exit(1)
            }
            console.log(release)
          })
        })
      })
    } else {
      console.log('The version has not changed (' + pkg.version + '). A new release is unnecessary. Aborting deployment with success code.')
      process.exit(0)
    }
  })
})
