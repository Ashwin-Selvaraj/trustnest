// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @dev Minimal ERC-5192 interface (soulbound tokens).
interface IERC5192 {
    event Locked(uint256 indexed tokenId);
    event Unlocked(uint256 indexed tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

/// @notice Soulbound reputation token. One token per party per agreement at close.
contract ReputationSBT is ERC721, AccessControl, IERC5192 {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 private _nextTokenId;

    struct ReputationData {
        bytes32 agreementId;
        bool    isOwnerRole; // false = TENANT, true = OWNER
        uint8   score;       // 1–5
        uint256 mintedAt;
    }

    mapping(uint256 tokenId  => ReputationData) public reputationOf;
    mapping(address owner    => uint256[])       public tokensByOwner;

    event ReputationMinted(
        bytes32 indexed agreementId,
        address         tenant,
        uint8           tenantScore,
        address         owner,
        uint8           ownerScore
    );

    constructor(address admin, address operator) ERC721("TrustNest Reputation", "TNREP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
    }

    function mint(
        bytes32 agreementId,
        address tenant,
        uint8   tenantScore,
        address owner,
        uint8   ownerScore
    ) external onlyRole(OPERATOR_ROLE) {
        require(tenantScore >= 1 && tenantScore <= 5, "SBT: invalid tenant score");
        require(ownerScore  >= 1 && ownerScore  <= 5, "SBT: invalid owner score");

        uint256 tenantTokenId = ++_nextTokenId;
        uint256 ownerTokenId  = ++_nextTokenId;

        _safeMint(tenant, tenantTokenId);
        _safeMint(owner,  ownerTokenId);

        reputationOf[tenantTokenId] = ReputationData({
            agreementId: agreementId,
            isOwnerRole: false,
            score:       tenantScore,
            mintedAt:    block.timestamp
        });
        reputationOf[ownerTokenId] = ReputationData({
            agreementId: agreementId,
            isOwnerRole: true,
            score:       ownerScore,
            mintedAt:    block.timestamp
        });

        tokensByOwner[tenant].push(tenantTokenId);
        tokensByOwner[owner].push(ownerTokenId);

        emit Locked(tenantTokenId);
        emit Locked(ownerTokenId);
        emit ReputationMinted(agreementId, tenant, tenantScore, owner, ownerScore);
    }

    /// ERC-5192: always locked — no transfers possible.
    function locked(uint256 /*tokenId*/) external pure override returns (bool) {
        return true;
    }

    /// Returns average score * 10 (e.g. 45 = 4.5) and total token count.
    function scoreOf(address user) external view returns (uint256 average, uint256 count) {
        uint256[] storage tokens = tokensByOwner[user];
        count = tokens.length;
        if (count == 0) return (0, 0);

        uint256 total;
        for (uint256 i = 0; i < count; i++) {
            total += reputationOf[tokens[i]].score;
        }
        average = (total * 10) / count;
    }

    /// ERC-5192: block all transfers; allow only minting (from == address(0)).
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0), "SBT: soulbound - transfer not allowed");
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl) returns (bool)
    {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}
