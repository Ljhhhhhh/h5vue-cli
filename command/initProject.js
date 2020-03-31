const path = require('path')
const fs = require('fs')
const exec = require('child_process').exec
const chalk = require('chalk')
const inquirer = require('inquirer')
const download = require('download-git-repo')
const CLI = require('clui')
const figlet = require('figlet')
const Spinner = CLI.Spinner
const tpl = require('../tpl')

module.exports = function () {
  const tplNameList = Object.keys(tpl)
  const downloadCountdown = new Spinner(chalk.cyan('Downloading Template...  '), ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'])
  const installCountdown = new Spinner(chalk.cyan('Installing dependencies...  '), ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'])
  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'What\' s your project name?',
      validate (val) {
        if (val) return true
        return 'Please enter your project name';
      },
      filter (val) {
        return val.replace(/\//g, '_')
      }
    },
    {
      type: 'list',
      name: 'tplName',
      message: 'Choose your template',
      choices: tplNameList,
      filter (val) {
        return val.toLowerCase()
      }
    },
    {
      type: 'list',
      name: 'devSource',
      message: 'packages source',
      choices: ['yarn', 'tyarn', 'npm', 'cnpm']
    },
  ]
  let downloadUrl, projectName, devSource
  inquirer.prompt(questions)
    .then(answers => {
      const { tplName } = answers
      downloadUrl = tpl[tplName].downloadUrl
      projectName = answers.projectName
      downloadCountdown.start()
      devSource = answers.devSource
    })
    .then(() => new Promise((resolve, reject) => {
      download(downloadUrl, path.resolve(process.cwd(), projectName), err => {
        if (err) reject()
        resolve()
      })
    }))
    .then(() => {
      const pkg = JSON.parse(fs.readFileSync(`${projectName}/package.json`))
      pkg.name = projectName
      fs.writeFileSync(`${projectName}/package.json`, JSON.stringify(pkg))
    })
    .then(() => new Promise((resolve, reject) => {
      downloadCountdown.stop()
      let comd
      switch (devSource) {
        case 'yarn':
          comd = 'yarn'
          break
        case 'tyarn':
          comd = 'tyarn'
          break
        case 'npm':
          comd = 'npm install'
          break
        case 'cnpm':
          comd = 'cnpm install'
          break
      }
      const commandStr = `cd ${projectName} && ${comd} && cd ..`
      installCountdown.start()
      exec(commandStr, err => {
        if (err) reject()
        resolve()
      })
    }))
    .then(() => fs.writeFileSync(`${projectName}/.env`, 'SKIP_PREFLIGHT_CHECK=true'))
    .then(() => new Promise((resolve, reject) => {
      installCountdown.stop()
      figlet('Enjoy your h5vue!', 'Standard', (err, data) => {
        if (err) reject()
        resolve(data)
      })
    }))
    .then(data => console.log(data, '\n'))
    .then(() => {
      let comd
      switch (devSource) {
        case 'yarn':
        case 'tyarn':
          comd = 'yarn'
          break
        case 'npm':
        case 'cnpm':
          comd = 'npm run'
          break
      }
      console.log(
        `  Your project has been inited! To launch your app please
  
        ${chalk.yellow(`cd ${projectName} && ${comd} serve`)}`
      )
    })
    .catch(console.log)
}
