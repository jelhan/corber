'use strict';

const td            = require('testdouble');
const expect        = require('../../helpers/expect');
const Promise       = require('ember-cli/lib/ext/promise');

const ServeCmd      = require('../../../lib/commands/serve');
const BuildWatchTask = require('../../../lib/tasks/ember-build-watch');
const CdvBuildTask  = require('../../../lib/tasks/cordova-build');
const BashTask      = require('../../../lib/tasks/bash');
const HookTask      = require('../../../lib/tasks/run-hook');
const ServeTask     = require('../../../lib/tasks/serve-hang');

const mockProject   = require('../../fixtures/ember-cordova-mock/project');

describe('Serve Command', () => {
  afterEach(() => {
    td.reset();
  });

  beforeEach(() => {
    ServeCmd.ui = mockProject.ui;

    ServeCmd.project = mockProject.project;
    ServeCmd.project.config = function() {
      return {
        locationType: 'hash'
      }
    }
  });

  function runServe(_options) {
    let options = _options || {};

    return ServeCmd.run(options);
  }

  context('when locationType is hash', () => {
    let tasks = [];

    beforeEach(() => {
      mockTasks();
    });

    it('exits cleanly', () => {
      expect(runServe).not.to.throw(Error);
    });

    function mockTasks() {
      tasks = [];

      td.replace(HookTask.prototype, 'run',  (hookName) => {
        tasks.push('hook ' + hookName);
        return Promise.resolve();
      });

      td.replace(CdvBuildTask.prototype, 'run', () => {
        tasks.push('cordova-build');
        return Promise.resolve();
      });

      td.replace(BuildWatchTask.prototype, 'run', () => {
        tasks.push('ember-build-watch');
        return Promise.resolve();
      });

      td.replace(BashTask.prototype, 'run', () => {
        tasks.push('serve-bash');
        return Promise.resolve();
      });

      td.replace(ServeTask.prototype, 'run', () => {
        tasks.push('serve-hang');
        return Promise.resolve();
      });
    }

    it('runs tasks in the correct order', () => {
      return ServeCmd.run({})
        .then(function() {
          expect(tasks).to.deep.equal([
            'hook beforeBuild',
            'ember-build-watch',
            'cordova-build',
            'hook afterBuild',
            'serve-hang'
          ]);
        });
    });
  });

  context('when locationType is not hash', () => {
    beforeEach(() => {
      ServeCmd.project.config = function() {
        return {
          locationType: 'auto'
        }
      };
    });

    it('throws', () => {
      expect(runServe).to.throw(Error);
    });
  });
});
