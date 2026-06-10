{
  description = "tellus devshell";
  inputs = {
    utils.url = "github:numtide/flake-utils";
  };
  outputs = {
    self,
    nixpkgs,
    utils,
  }:
    utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            # firmware dependencies

            # db dependencies

            # rust dependencies

            # frontend dependencies
          ];
        };
      }
    );
}
