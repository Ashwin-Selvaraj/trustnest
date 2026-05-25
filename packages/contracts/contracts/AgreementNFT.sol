// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Dual-mint NFT: one token for the tenant, one for the owner per agreement.
contract AgreementNFT is ERC721, AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 private _nextTokenId;

    mapping(uint256 tokenId   => bytes32) public tokenAgreement;
    mapping(bytes32 agreementId => uint256) public tenantToken;
    mapping(bytes32 agreementId => uint256) public ownerToken;
    mapping(uint256 tokenId   => string)  private _metadataURIs;

    event AgreementMinted(
        bytes32 indexed agreementId,
        uint256         tenantTokenId,
        uint256         ownerTokenId
    );

    constructor(address admin, address operator) ERC721("TrustNest Agreement", "TNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, operator);
    }

    function mint(
        bytes32        agreementId,
        address        tenant,
        address        owner,
        string calldata metadataURI
    ) external onlyRole(OPERATOR_ROLE) returns (uint256 tenantTokenId, uint256 ownerTokenId) {
        require(tenantToken[agreementId] == 0, "AgreementNFT: already minted");

        tenantTokenId = ++_nextTokenId;
        ownerTokenId  = ++_nextTokenId;

        _safeMint(tenant, tenantTokenId);
        _safeMint(owner,  ownerTokenId);

        tokenAgreement[tenantTokenId] = agreementId;
        tokenAgreement[ownerTokenId]  = agreementId;
        tenantToken[agreementId]      = tenantTokenId;
        ownerToken[agreementId]       = ownerTokenId;
        _metadataURIs[tenantTokenId]  = metadataURI;
        _metadataURIs[ownerTokenId]   = metadataURI;

        emit AgreementMinted(agreementId, tenantTokenId, ownerTokenId);
    }

    function updateMetadata(uint256 tokenId, string calldata newURI) external onlyRole(OPERATOR_ROLE) {
        _requireOwned(tokenId);
        _metadataURIs[tokenId] = newURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _metadataURIs[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
