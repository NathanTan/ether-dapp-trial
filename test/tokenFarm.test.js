const { assert } = require('chai')

const DappToken = artifacts.require('DappToken')
const DaiToken = artifacts.require('DaiToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai').use(require('chai-as-promised'))
    .should()

const tokens = (n) => {
    return web3.utils.toWei(n, 'ether')
}

 // Some swaggy js syntax for lists
contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm

    before(async () => {
        // Load Constracts
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        // Transfer all dapp tokens to the farm
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        // Sendt tokens to investor
        await daiToken.transfer(investor, tokens('100'), { from: owner})
    })
    
    
    // Tests go here
    describe('Mock Dai Deployment', async() => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })
        
    describe('Dapp Token Deployment', async() => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })
    describe('Token Farm Deployment', async() => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm 2')
        })

        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    })

    describe('Farming tokens', async () => {
        it('rewards investors for staking mDai tokens', async () => {
            let result

            // Check investor balance for staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct before staking')

            // Stake Mock DAI Tokens
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor })
            await tokenFarm.stakeTokens(tokens('100'), { from: investor })

            // Check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'Token Farm Mock DAI balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'investor staking balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking status correct after staking')

            // Issue tokens
            await tokenFarm.issueTokens({ from: owner})

            // Check balances after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor DApp Token wallet balance correct after issuance')

            // Ensure that only owner can issue tokens
            await tokenFarm.issueTokens({ from: investor}).should.be.rejected

            // Unstake tokens
            await tokenFarm.unstakeTokens({ from: investor })

            // Check results after unstaking

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct after unstaking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI balance correct after unstaking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after unstaking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'investor staking status correct after unstaking')
        })
    })
}) 