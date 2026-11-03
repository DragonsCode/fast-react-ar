import importlib.util
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

MAIN = Path(__file__).resolve().parents[1] / "main.py"


@pytest.fixture
def service(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    spec = importlib.util.spec_from_file_location("ar_upload_test", MAIN)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.models_db = {}
    with TestClient(module.app) as client:
        yield module, client, tmp_path


def upload(client, model_id="example", glb=b"glTFexample", usdz=b"PKexample"):
    return client.post(
        "/api/upload",
        data={"title": "Example", "model_id": model_id},
        files={
            "glb_file": ("example.glb", glb, "application/octet-stream"),
            "usdz_file": ("example.usdz", usdz, "application/octet-stream"),
        },
    )


@pytest.mark.parametrize("model_id", ["../escape", "nested/path", "nested\\path", ".", "..", "x" * 65])
def test_invalid_identifiers_never_write_files(service, model_id):
    module, client, root = service
    response = upload(client, model_id)
    assert response.status_code == 400
    assert module.models_db == {}
    assert list((root / "static").iterdir()) == []
    assert not (root / "escape.glb").exists()


def test_absolute_identifier_is_rejected(service):
    _, client, root = service
    outside = root / "outside"
    response = upload(client, str(outside))
    assert response.status_code == 400
    assert not outside.with_suffix(".glb").exists()


@pytest.mark.parametrize("field", ["glb", "usdz"])
def test_oversized_files_are_rejected_without_partial_writes(service, monkeypatch, field):
    module, client, root = service
    monkeypatch.setattr(module, "MAX_MODEL_BYTES", 12, raising=False)
    content = (b"glTF" if field == "glb" else b"PK") + b"x" * 13
    response = upload(client, **{field: content})
    assert response.status_code == 413
    assert list((root / "static").iterdir()) == []
    assert module.models_db == {}


def test_existing_asset_is_not_overwritten(service):
    module, client, root = service
    existing = root / "static" / "example.usdz"
    existing.write_bytes(b"existing-user-file")
    response = upload(client)
    assert response.status_code == 409
    assert existing.read_bytes() == b"existing-user-file"
    assert not existing.with_suffix(".glb").exists()
    assert module.models_db == {}


def test_symlink_target_is_not_modified(service):
    _, client, root = service
    outside = root / "important"
    outside.write_bytes(b"keep")
    (root / "static" / "example.glb").symlink_to(outside)
    assert upload(client).status_code == 409
    assert outside.read_bytes() == b"keep"


def test_database_failure_rolls_back_files_and_does_not_disclose_error(service, monkeypatch):
    module, client, root = service

    def fail(_):
        raise OSError("synthetic-private-path")

    monkeypatch.setattr(module, "save_models_db", fail)
    response = upload(client)
    assert response.status_code == 500
    assert "synthetic-private-path" not in response.text
    assert list((root / "static").iterdir()) == []
    assert module.models_db == {}


def test_success_and_duplicate_preserve_public_contract(service):
    module, client, root = service
    response = upload(client, "safe-ID_42")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["model_id"] == "safe-ID_42"
    assert client.get("/api/model/safe-ID_42").json()["title"] == "Example"
    assert client.get("/api/models").json()["count"] == 1
    assert (root / "static" / "safe-ID_42.glb").read_bytes() == b"glTFexample"
    assert "safe-ID_42" in module.load_models_db()
    assert upload(client, "safe-ID_42").status_code == 400


def test_bad_signature_leaves_no_artifacts(service):
    module, client, root = service
    assert upload(client, usdz=b"invalid").status_code == 400
    assert not module.models_db
    assert list((root / "static").iterdir()) == []
