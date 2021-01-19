pragma solidity ^0.4.17;

contract Election {
    struct Candidate{
        string name;
        uint voteCount;
    }
    struct Voter{
        bool voted;
        uint vote;
    }
    address public owner;
    string public electionName;
    mapping(address => Voter) public voters;
    Candidate[] public candidates;
    uint public totalVotes;
    
    modifier ownerOnly() {
        require(msg.sender == owner);
        _;
    }
    
    function Election(string _name) public {
        owner = msg.sender;
        electionName = _name;
    }
    
    function addCandidate(string _name) ownerOnly public {
        candidates.push(Candidate(_name,0));
    }
    
    function getNumCandidate() public view returns(uint) {
        return candidates.length;
    }
    
    function vote(uint _voteIndex) public {
        require(!voters[msg.sender].voted);
        require(msg.sender != owner);
        
        voters[msg.sender].vote =_voteIndex;
        voters[msg.sender].voted=true;
        
        candidates[_voteIndex].voteCount +=1;
        totalVotes+=1;
    }
    
    
    function end() ownerOnly public {
        selfdestruct(owner);
    }
}