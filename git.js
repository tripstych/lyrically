const express = require('express');
const app = express();
const { exec } = require('child_process');
const path = require('path');

const router = express.Router();
// set the port
const PORT = 6000;  
app.listen(PORT, () => {
    console.log(`Git server is running on http://localhost:${PORT}`);
});






/**
 * Execute git pull command
 * POST /git/pull
 */
router.post('/pull', (req, res) => {
    console.log('Git pull request received');
    
    // Execute git pull command
    exec('git pull', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error('Git pull error:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                stderr: stderr
            });
        }
        
        if (stderr && !stderr.includes('Already up to date')) {
            console.warn('Git pull stderr:', stderr);
        }
        
        console.log('Git pull stdout:', stdout);
        
        res.json({
            success: true,
            message: 'Git pull executed successfully',
            output: stdout,
            stderr: stderr || null
        });
    });
});

/**
 * Get git status
 * GET /git/status
 */
router.get('/status', (req, res) => {
    console.log('Git status request received');
    
    exec('git status --porcelain', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error('Git status error:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                stderr: stderr
            });
        }
        
        const changes = stdout.trim().split('\n').filter(line => line.length > 0);
        
        res.json({
            success: true,
            hasChanges: changes.length > 0,
            changes: changes,
            raw: stdout
        });
    });
});

/**
 * Get current branch and latest commit info
 * GET /git/info
 */
router.get('/info', (req, res) => {
    console.log('Git info request received');
    
    // Get current branch
    exec('git branch --show-current', { cwd: __dirname }, (error, branchOutput, stderr) => {
        if (error) {
            console.error('Git branch error:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                stderr: stderr
            });
        }
        
        const currentBranch = branchOutput.trim();
        
        // Get latest commit info
        exec('git log -1 --pretty=format:"%H|%an|%ad|%s" --date=iso', { cwd: __dirname }, (error, commitOutput, stderr) => {
            if (error) {
                console.error('Git log error:', error);
                return res.status(500).json({
                    success: false,
                    error: error.message,
                    stderr: stderr
                });
            }
            
            const [hash, author, date, message] = commitOutput.split('|');
            
            res.json({
                success: true,
                branch: currentBranch,
                latestCommit: {
                    hash: hash,
                    author: author,
                    date: date,
                    message: message
                }
            });
        });
    });
});

module.exports = router;
