from __future__ import annotations
import ast, secrets
from pathlib import Path
BACKEND_DIR=Path(__file__).resolve().parents[1]
VERSIONS_DIR=BACKEND_DIR/"alembic"/"versions"
SLUG="add_deposits_and_payment_link"
def vals(path):
    tree=ast.parse(path.read_text(encoding="utf-8")); rev=None; down=None
    for node in tree.body:
        name=None; value=None
        if isinstance(node,ast.Assign) and len(node.targets)==1 and isinstance(node.targets[0],ast.Name): name=node.targets[0].id; value=node.value
        elif isinstance(node,ast.AnnAssign) and isinstance(node.target,ast.Name): name=node.target.id; value=node.value
        if name not in {"revision","down_revision"}:continue
        try:v=ast.literal_eval(value)
        except Exception:continue
        if name=="revision":rev=v
        else:down=v
    return rev,down
def current_head():
    revs=set(); refs=set()
    for p in VERSIONS_DIR.glob("*.py"):
        rev,down=vals(p)
        if isinstance(rev,str):revs.add(rev)
        if isinstance(down,str):refs.add(down)
        elif isinstance(down,(tuple,list)):refs.update(x for x in down if isinstance(x,str))
    heads=sorted(revs-refs)
    if len(heads)!=1:raise RuntimeError(f"Expected exactly one Alembic head before Pass 6, found {heads}")
    return heads[0]
def main():
    existing=list(VERSIONS_DIR.glob(f"*_{SLUG}.py"))
    if existing:print(f"Pass 6 migration already exists: {existing[0].name}");return
    down=current_head(); rev=secrets.token_hex(6); out=VERSIONS_DIR/f"{rev}_{SLUG}.py"
    template=f"""\"\"\"Add first-class deposits and link payments to deposits.\n\nRevision ID: {rev}\nRevises: {down}\n\"\"\"\nfrom alembic import op\nimport sqlalchemy as sa\nrevision = \"{rev}\"\ndown_revision = \"{down}\"\nbranch_labels = None\ndepends_on = None\n\ndef upgrade() -> None:\n    op.create_table(\n        \"deposits\",\n        sa.Column(\"id\", sa.Uuid(), nullable=False),\n        sa.Column(\"user_id\", sa.Uuid(), nullable=False),\n        sa.Column(\"account_id\", sa.Uuid(), nullable=False),\n        sa.Column(\"transaction_id\", sa.Uuid(), nullable=True),\n        sa.Column(\"amount\", sa.Numeric(18, 2), nullable=False),\n        sa.Column(\"currency\", sa.String(length=3), nullable=False),\n        sa.Column(\"status\", sa.String(length=30), nullable=False),\n        sa.Column(\"completed_at\", sa.DateTime(timezone=True), nullable=True),\n        sa.Column(\"created_at\", sa.DateTime(timezone=True), server_default=sa.text(\"now()\"), nullable=False),\n        sa.Column(\"updated_at\", sa.DateTime(timezone=True), server_default=sa.text(\"now()\"), nullable=False),\n        sa.ForeignKeyConstraint([\"account_id\"], [\"accounts.id\"], ondelete=\"RESTRICT\"),\n        sa.ForeignKeyConstraint([\"transaction_id\"], [\"transactions.id\"], ondelete=\"SET NULL\"),\n        sa.ForeignKeyConstraint([\"user_id\"], [\"users.id\"], ondelete=\"RESTRICT\"),\n        sa.PrimaryKeyConstraint(\"id\"),\n        sa.UniqueConstraint(\"transaction_id\"),\n    )\n    op.create_index(op.f(\"ix_deposits_account_id\"), \"deposits\", [\"account_id\"], unique=False)\n    op.create_index(op.f(\"ix_deposits_status\"), \"deposits\", [\"status\"], unique=False)\n    op.create_index(op.f(\"ix_deposits_user_id\"), \"deposits\", [\"user_id\"], unique=False)\n    op.add_column(\"payments\", sa.Column(\"deposit_id\", sa.Uuid(), nullable=True))\n    op.create_index(op.f(\"ix_payments_deposit_id\"), \"payments\", [\"deposit_id\"], unique=False)\n    op.create_foreign_key(\"fk_payments_deposit_id_deposits\", \"payments\", \"deposits\", [\"deposit_id\"], [\"id\"], ondelete=\"SET NULL\")\n\ndef downgrade() -> None:\n    op.drop_constraint(\"fk_payments_deposit_id_deposits\", \"payments\", type_=\"foreignkey\")\n    op.drop_index(op.f(\"ix_payments_deposit_id\"), table_name=\"payments\")\n    op.drop_column(\"payments\", \"deposit_id\")\n    op.drop_index(op.f(\"ix_deposits_user_id\"), table_name=\"deposits\")\n    op.drop_index(op.f(\"ix_deposits_status\"), table_name=\"deposits\")\n    op.drop_index(op.f(\"ix_deposits_account_id\"), table_name=\"deposits\")\n    op.drop_table(\"deposits\")\n"""
    out.write_text(template,encoding="utf-8");print(f"Created {out.relative_to(BACKEND_DIR)}");print(f"down_revision = {down}");print("Next: alembic upgrade head")
if __name__=="__main__":main()
